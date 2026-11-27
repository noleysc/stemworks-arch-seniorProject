/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  appointmentWindowMinutes,
  windowsOverlap,
} from "@/lib/experiences/appointment-times";
import { getSpaService, requireSpaService } from "@/lib/experiences/spa-menu";
import { ensurePamperedEvents } from "@/lib/tenancy";
import { PublicError } from "@/lib/experiences/errors";
import {
  cardPaymentSchema,
  chargeTicketPayment,
  refundPayment,
  type CardPaymentInput,
} from "@/lib/experiences/payments";
import type {
  AppointmentStatus,
  PaymentStatus,
  ServiceAppointmentRecord,
  SpaAppointmentReport,
  SpaClientRecord,
} from "@/lib/experiences/appointment-catalog";

export type {
  AppointmentStatus,
  PaymentStatus,
  ServiceAppointmentRecord,
  SpaAppointmentReport,
  SpaClientRecord,
} from "@/lib/experiences/appointment-catalog";
export {
  APPOINTMENT_STATUSES,
  PAYMENT_STATUSES,
  appointmentStatusLabel,
  paymentStatusLabel,
} from "@/lib/experiences/appointment-catalog";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required.")
  .max(40)
  .regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number.");

const ACTIVE_STATUSES: AppointmentStatus[] = ["booked", "confirmed"];

export const bookAppointmentSchema = z.object({
  serviceKey: z.string().trim().min(1, "Choose a service."),
  appointmentOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  startsAtLabel: z.string().trim().min(1, "Choose a time.").max(40),
  clientName: z.string().trim().min(1, "Name is required.").max(160),
  clientEmail: z.string().trim().email("A valid email is required.").max(200),
  clientPhone: phoneSchema,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  preferences: z.string().trim().max(1000).optional().or(z.literal("")),
  therapistLabel: z.string().trim().max(120).optional().or(z.literal("")),
  staffNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  /** When set, charge the full service price at booking (same helper as tickets). */
  payment: cardPaymentSchema.optional(),
  /** Staff-only: skip card and leave unpaid (default for staff desk). */
  payLater: z.boolean().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  startsAtLabel: z.string().trim().min(1, "Choose a time.").max(40),
  serviceKey: z.string().trim().min(1).optional(),
  therapistLabel: z.string().trim().max(120).optional().or(z.literal("")),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["booked", "confirmed", "completed", "no_show", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "deposit", "paid", "refunded"]).optional(),
  depositCents: z.number().int().min(0).max(1_000_000).optional(),
  amountPaidCents: z.number().int().min(0).max(1_000_000).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  preferences: z.string().trim().max(1000).optional().nullable(),
  staffNotes: z.string().trim().max(2000).optional().nullable(),
  therapistLabel: z.string().trim().max(120).optional().nullable(),
  markConfirmationSent: z.boolean().optional(),
});

export const collectPaymentSchema = z.object({
  kind: z.enum(["deposit", "balance", "full"]),
  /** card = Stripe/demo charge; manual = staff-recorded cash/terminal without card fields */
  method: z.enum(["card", "manual"]).default("manual"),
  amountCents: z.number().int().min(1).max(1_000_000).optional(),
  card: z
    .object({
      cardholderName: z.string().trim().min(2).max(120),
      cardNumber: z.string().trim().min(12).max(23),
      expMonth: z.coerce.number().int().min(1).max(12),
      expYear: z.coerce.number().int().min(2026).max(2100),
      cvc: z.string().trim().regex(/^\d{3,4}$/),
    })
    .optional(),
});

export const updateClientSchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(1).max(160).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  preferences: z.string().trim().max(2000).optional().nullable(),
  spaNotes: z.string().trim().max(4000).optional().nullable(),
});

export async function bookServiceAppointment(raw: z.input<typeof bookAppointmentSchema>) {
  const input = bookAppointmentSchema.parse(raw);
  const service = requireSpaService(input.serviceKey);
  if (service.menuPriceCents == null) {
    throw new PublicError("That service needs a quoted price — call the spa to book it.");
  }

  const venture = await ensurePamperedEvents();
  await assertSlotAvailable({
    ventureId: venture.id,
    appointmentOn: input.appointmentOn,
    startsAtLabel: input.startsAtLabel,
    durationMinutes: service.durationMinutes,
  });

  const email = input.clientEmail.toLowerCase();
  const guest = await prisma.guestProfile.upsert({
    where: { email },
    update: {
      fullName: input.clientName,
      phone: input.clientPhone.trim(),
      ...(emptyToNull(input.preferences)
        ? { preferences: emptyToNull(input.preferences) }
        : {}),
    },
    create: {
      email,
      fullName: input.clientName,
      phone: input.clientPhone.trim(),
      preferences: emptyToNull(input.preferences),
    },
  });

  const confirmationCode = await nextAppointmentCode();
  const priceCents = service.menuPriceCents;
  if (priceCents > 0 && !input.payLater && !input.payment) {
    throw new PublicError("Payment is required to book this service. Enter your card details.");
  }
  const shouldCharge = Boolean(input.payment) && !input.payLater && priceCents > 0;

  let charge: Awaited<ReturnType<typeof chargeTicketPayment>> | null = null;
  if (shouldCharge) {
    charge = await chargeTicketPayment({
      amountCents: priceCents,
      email,
      phone: input.clientPhone.trim(),
      fullName: input.clientName,
      description: `Spa ${service.title} (${input.appointmentOn} ${input.startsAtLabel})`,
      card: input.payment,
    });
  }

  const appointment = await prisma.serviceAppointment.create({
    data: {
      ventureId: venture.id,
      guestId: guest.id,
      clientName: input.clientName,
      clientEmail: email,
      clientPhone: input.clientPhone.trim(),
      serviceKey: service.key,
      serviceTitle: service.title,
      durationMinutes: service.durationMinutes,
      priceCents,
      paymentStatus: charge ? "paid" : "unpaid",
      amountPaidCents: charge?.amountCents ?? 0,
      paymentRef: charge?.paymentRef ?? null,
      paymentBrand: charge?.brand ?? null,
      paymentLast4: charge?.last4 || null,
      appointmentOn: input.appointmentOn,
      startsAtLabel: input.startsAtLabel,
      status: charge ? "confirmed" : "booked",
      therapistLabel: emptyToNull(input.therapistLabel),
      notes: emptyToNull(input.notes),
      preferences: emptyToNull(input.preferences) ?? guest.preferences,
      staffNotes: emptyToNull(input.staffNotes),
      confirmationCode,
    },
  });

  return toRecord(appointment);
}

export async function listAppointments(
  range?: { from?: string; to?: string; includeCancelled?: boolean; status?: string },
) {
  const venture = await ensurePamperedEvents();
  const rows = await prisma.serviceAppointment.findMany({
    where: {
      ventureId: venture.id,
      ...(range?.includeCancelled || range?.status
        ? range?.status
          ? { status: range.status }
          : {}
        : { status: { not: "cancelled" } }),
      ...(range?.from || range?.to
        ? {
            appointmentOn: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lte: range.to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ appointmentOn: "asc" }, { startsAtLabel: "asc" }],
  });
  return rows.map(toRecord);
}

export async function listAppointmentsForDay(day: string) {
  return listAppointments({ from: day, to: day });
}

export async function getAppointment(id: string) {
  const venture = await ensurePamperedEvents();
  const row = await prisma.serviceAppointment.findFirst({
    where: { id, ventureId: venture.id },
  });
  if (!row) throw new PublicError("That appointment was not found.");
  return toRecord(row);
}

export async function rescheduleAppointment(
  id: string,
  raw: z.input<typeof rescheduleAppointmentSchema>,
) {
  const input = rescheduleAppointmentSchema.parse(raw);
  const venture = await ensurePamperedEvents();
  const existing = await prisma.serviceAppointment.findFirst({
    where: { id, ventureId: venture.id },
  });
  if (!existing) throw new PublicError("That appointment was not found.");
  if (existing.status === "cancelled") {
    throw new PublicError("Cancelled appointments cannot be rescheduled.");
  }
  if (existing.status === "completed") {
    throw new PublicError("Completed appointments cannot be rescheduled.");
  }

  const serviceKey = input.serviceKey ?? existing.serviceKey;
  const service = requireSpaService(serviceKey);
  if (service.menuPriceCents == null) {
    throw new PublicError("That service needs a quoted price — call the spa to book it.");
  }

  await assertSlotAvailable({
    ventureId: venture.id,
    appointmentOn: input.appointmentOn,
    startsAtLabel: input.startsAtLabel,
    durationMinutes: service.durationMinutes,
    excludeId: id,
  });

  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: {
      appointmentOn: input.appointmentOn,
      startsAtLabel: input.startsAtLabel,
      serviceKey: service.key,
      serviceTitle: service.title,
      durationMinutes: service.durationMinutes,
      priceCents: service.menuPriceCents,
      therapistLabel:
        input.therapistLabel === undefined
          ? existing.therapistLabel
          : emptyToNull(input.therapistLabel),
      status: existing.status === "no_show" ? "booked" : existing.status,
    },
  });
  return toRecord(updated);
}

export async function updateAppointment(id: string, raw: z.input<typeof updateAppointmentSchema>) {
  const input = updateAppointmentSchema.parse(raw);
  const venture = await ensurePamperedEvents();
  const existing = await prisma.serviceAppointment.findFirst({
    where: { id, ventureId: venture.id },
  });
  if (!existing) throw new PublicError("That appointment was not found.");

  if (input.status === "cancelled" && existing.status === "cancelled") {
    return toRecord(existing);
  }

  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: {
      ...(input.status
        ? {
            status: input.status,
            cancelledAt: input.status === "cancelled" ? new Date() : existing.cancelledAt,
          }
        : {}),
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
      ...(input.depositCents !== undefined ? { depositCents: input.depositCents } : {}),
      ...(input.amountPaidCents !== undefined ? { amountPaidCents: input.amountPaidCents } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.preferences !== undefined
        ? { preferences: input.preferences?.trim() || null }
        : {}),
      ...(input.staffNotes !== undefined ? { staffNotes: input.staffNotes?.trim() || null } : {}),
      ...(input.therapistLabel !== undefined
        ? { therapistLabel: input.therapistLabel?.trim() || null }
        : {}),
      ...(input.markConfirmationSent ? { confirmationSentAt: new Date() } : {}),
    },
  });

  if (input.preferences !== undefined && existing.guestId) {
    await prisma.guestProfile.update({
      where: { id: existing.guestId },
      data: { preferences: input.preferences?.trim() || null },
    });
  }

  return toRecord(updated);
}

export async function cancelAppointment(id: string) {
  return updateAppointment(id, { status: "cancelled" });
}

export async function collectAppointmentPayment(
  id: string,
  raw: z.input<typeof collectPaymentSchema>,
) {
  const input = collectPaymentSchema.parse(raw);
  const venture = await ensurePamperedEvents();
  const existing = await prisma.serviceAppointment.findFirst({
    where: { id, ventureId: venture.id },
  });
  if (!existing) throw new PublicError("That appointment was not found.");
  if (existing.status === "cancelled") {
    throw new PublicError("Cancelled appointments cannot take payment.");
  }
  if (existing.paymentStatus === "refunded") {
    throw new PublicError("Refunded appointments cannot take another charge here. Record the payment manually if needed.");
  }

  const balance = Math.max(0, existing.priceCents - existing.amountPaidCents);
  let chargeCents = input.amountCents ?? 0;
  if (input.kind === "deposit") {
    chargeCents = input.amountCents ?? Math.min(Math.max(existing.depositCents || Math.round(existing.priceCents * 0.25), 1), balance || existing.priceCents);
  } else if (input.kind === "balance" || input.kind === "full") {
    chargeCents = input.amountCents ?? (balance > 0 ? balance : existing.priceCents);
  }
  if (chargeCents <= 0) {
    throw new PublicError("There is nothing left to charge on this appointment.");
  }

  let paymentRef: string;
  let paymentBrand: string;
  let paymentLast4: string | null;
  let charged = chargeCents;

  if (input.method === "manual") {
    paymentRef = `manual_${Date.now().toString(36)}`;
    paymentBrand = "manual";
    paymentLast4 = null;
  } else {
    const charge = await chargeTicketPayment({
      amountCents: chargeCents,
      email: existing.clientEmail ?? "spa@thepamperedsoul.local",
      phone: existing.clientPhone ?? "",
      fullName: existing.clientName,
      description: `Spa ${existing.serviceTitle} (${existing.confirmationCode ?? existing.id})`,
      card: (input.card as CardPaymentInput | undefined) ?? null,
    });
    paymentRef = charge.paymentRef;
    paymentBrand = charge.brand;
    paymentLast4 = charge.last4 || null;
    charged = charge.amountCents;
  }

  const amountPaidCents = existing.amountPaidCents + charged;
  const paymentStatus: PaymentStatus =
    amountPaidCents >= existing.priceCents
      ? "paid"
      : amountPaidCents > 0
        ? "deposit"
        : "unpaid";

  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: {
      amountPaidCents,
      depositCents:
        input.kind === "deposit"
          ? Math.max(existing.depositCents, charged)
          : existing.depositCents,
      paymentStatus,
      paymentRef,
      paymentBrand,
      paymentLast4,
      status: existing.status === "booked" ? "confirmed" : existing.status,
    },
  });
  return toRecord(updated);
}

export async function markAppointmentRefunded(id: string) {
  const venture = await ensurePamperedEvents();
  const existing = await prisma.serviceAppointment.findFirst({
    where: { id, ventureId: venture.id },
  });
  if (!existing) throw new PublicError("That appointment was not found.");
  if (existing.amountPaidCents <= 0 && existing.paymentStatus === "unpaid") {
    throw new PublicError("Nothing was collected on this appointment to refund.");
  }
  await refundPayment(existing.paymentRef);
  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: {
      paymentStatus: "refunded",
      amountPaidCents: 0,
    },
  });
  return toRecord(updated);
}

export async function listSpaClients(query?: string) {
  const venture = await ensurePamperedEvents();
  const appointments = await prisma.serviceAppointment.findMany({
    where: { ventureId: venture.id },
    orderBy: [{ appointmentOn: "desc" }, { startsAtLabel: "desc" }],
  });

  const byEmail = new Map<string, ServiceAppointmentRecord[]>();
  for (const row of appointments) {
    const key = (row.clientEmail ?? `name:${row.clientName}`).toLowerCase();
    const list = byEmail.get(key) ?? [];
    list.push(toRecord(row));
    byEmail.set(key, list);
  }

  const guests = await prisma.guestProfile.findMany({
    where: {
      OR: [
        { appointments: { some: { ventureId: venture.id } } },
        ...(query
          ? [
              { email: { contains: query.toLowerCase() } },
              { fullName: { contains: query } },
              { phone: { contains: query } },
            ]
          : []),
      ],
    },
    orderBy: { fullName: "asc" },
  });

  const records: SpaClientRecord[] = [];
  const seen = new Set<string>();

  for (const guest of guests) {
    const history = byEmail.get(guest.email.toLowerCase()) ?? [];
    if (history.length === 0 && !query) continue;
    seen.add(guest.email.toLowerCase());
    if (
      query &&
      !guest.email.toLowerCase().includes(query.toLowerCase()) &&
      !guest.fullName.toLowerCase().includes(query.toLowerCase()) &&
      !(guest.phone ?? "").includes(query)
    ) {
      continue;
    }
    records.push({
      id: guest.id,
      email: guest.email,
      fullName: guest.fullName,
      phone: guest.phone,
      preferences: guest.preferences,
      spaNotes: guest.spaNotes,
      appointmentCount: history.length,
      lastAppointmentOn: history[0]?.appointmentOn ?? null,
      appointments: history,
    });
  }

  for (const [email, history] of byEmail) {
    if (seen.has(email) || email.startsWith("name:")) continue;
    if (
      query &&
      !email.includes(query.toLowerCase()) &&
      !history[0]?.clientName.toLowerCase().includes(query.toLowerCase())
    ) {
      continue;
    }
    records.push({
      id: history[0]?.guestId ?? email,
      email: history[0]?.clientEmail ?? "",
      fullName: history[0]?.clientName ?? "Client",
      phone: history[0]?.clientPhone ?? null,
      preferences: history[0]?.preferences ?? null,
      spaNotes: null,
      appointmentCount: history.length,
      lastAppointmentOn: history[0]?.appointmentOn ?? null,
      appointments: history,
    });
  }

  records.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return records;
}

export async function updateSpaClient(raw: z.input<typeof updateClientSchema>) {
  const input = updateClientSchema.parse(raw);
  const email = input.email.toLowerCase();
  const guest = await prisma.guestProfile.findUnique({ where: { email } });
  if (!guest) throw new PublicError("That client was not found.");
  const updated = await prisma.guestProfile.update({
    where: { email },
    data: {
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.preferences !== undefined
        ? { preferences: input.preferences?.trim() || null }
        : {}),
      ...(input.spaNotes !== undefined ? { spaNotes: input.spaNotes?.trim() || null } : {}),
    },
  });
  const history = await listAppointments({ includeCancelled: true });
  const appointments = history.filter((row) => row.clientEmail === email);
  return {
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    phone: updated.phone,
    preferences: updated.preferences,
    spaNotes: updated.spaNotes,
    appointmentCount: appointments.length,
    lastAppointmentOn: appointments[0]?.appointmentOn ?? null,
    appointments,
  } satisfies SpaClientRecord;
}

export async function spaAppointmentReport(range?: { from?: string; to?: string }): Promise<SpaAppointmentReport> {
  const rows = await listAppointments({
    from: range?.from,
    to: range?.to,
    includeCancelled: true,
  });
  const byStatus: Record<string, number> = {};
  const byPaymentStatus: Record<string, number> = {};
  let bookedRevenueCents = 0;
  let collectedCents = 0;
  let outstandingCents = 0;
  let completedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byPaymentStatus[row.paymentStatus] = (byPaymentStatus[row.paymentStatus] ?? 0) + 1;
    if (row.status !== "cancelled") {
      bookedRevenueCents += row.priceCents;
      collectedCents += row.paymentStatus === "refunded" ? 0 : row.amountPaidCents;
      outstandingCents += row.balanceDueCents;
    }
    if (row.status === "completed") completedCount += 1;
    if (row.status === "no_show") noShowCount += 1;
    if (row.status === "cancelled") cancelledCount += 1;
  }

  return {
    from: range?.from ?? null,
    to: range?.to ?? null,
    totalAppointments: rows.length,
    byStatus,
    byPaymentStatus,
    bookedRevenueCents,
    collectedCents,
    outstandingCents,
    completedCount,
    noShowCount,
    cancelledCount,
  };
}

export function appointmentsToCsv(rows: ServiceAppointmentRecord[]) {
  const header = [
    "confirmation_code",
    "appointment_on",
    "starts_at",
    "status",
    "payment_status",
    "service",
    "duration_minutes",
    "price_cents",
    "amount_paid_cents",
    "deposit_cents",
    "client_name",
    "client_email",
    "client_phone",
    "therapist",
    "preferences",
    "notes",
    "staff_notes",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.confirmationCode,
        row.appointmentOn,
        row.startsAtLabel,
        row.status,
        row.paymentStatus,
        row.serviceTitle,
        row.durationMinutes,
        row.priceCents,
        row.amountPaidCents,
        row.depositCents,
        row.clientName,
        row.clientEmail,
        row.clientPhone,
        row.therapistLabel,
        row.preferences,
        row.notes,
        row.staffNotes,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** MassageBook-style CSV: client_name,email,phone,service,date,time,price,status,notes,preferences,therapist */
export async function importMassageBookCsv(csv: string) {
  if (csv.length > 1_500_000) {
    throw new PublicError("That import file is too large.");
  }
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new PublicError("The CSV needs a header row and at least one appointment.");
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const index = (names: string[]) => {
    for (const name of names) {
      const at = header.indexOf(name);
      if (at >= 0) return at;
    }
    return -1;
  };

  const col = {
    name: index(["client_name", "client", "name", "guest"]),
    email: index(["email", "client_email"]),
    phone: index(["phone", "client_phone", "mobile"]),
    service: index(["service", "service_name", "service_title"]),
    serviceKey: index(["service_key", "servicekey"]),
    date: index(["date", "appointment_on", "appointment_date"]),
    time: index(["time", "starts_at", "start_time", "starts_at_label"]),
    price: index(["price", "price_dollars", "amount"]),
    status: index(["status"]),
    notes: index(["notes", "note"]),
    preferences: index(["preferences", "prefs"]),
    therapist: index(["therapist", "provider", "staff"]),
  };
  if (col.name < 0 || col.date < 0 || col.time < 0) {
    throw new PublicError("CSV must include client name, date, and time columns.");
  }

  let created = 0;
  let skipped = 0;
  const issues: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    try {
      const clientName = cells[col.name]?.trim() ?? "";
      const clientEmail = (col.email >= 0 ? cells[col.email] : "").trim().toLowerCase();
      const clientPhone = (col.phone >= 0 ? cells[col.phone] : "").trim() || "000-000-0000";
      const appointmentOn = normalizeDate(cells[col.date] ?? "");
      const startsAtLabel = normalizeTimeLabel(cells[col.time] ?? "");
      const serviceKey =
        (col.serviceKey >= 0 ? cells[col.serviceKey] : "").trim() ||
        guessServiceKey((col.service >= 0 ? cells[col.service] : "") || "swedish-50");
      const notes = col.notes >= 0 ? cells[col.notes] : "";
      const preferences = col.preferences >= 0 ? cells[col.preferences] : "";
      const therapistLabel = col.therapist >= 0 ? cells[col.therapist] : "";

      if (!clientName || !appointmentOn || !startsAtLabel) {
        skipped += 1;
        issues.push(`Row ${i + 1}: missing required fields.`);
        continue;
      }
      if (!clientEmail) {
        skipped += 1;
        issues.push(`Row ${i + 1}: email is required for import.`);
        continue;
      }

      const appointment = await bookServiceAppointment({
        serviceKey,
        appointmentOn,
        startsAtLabel,
        clientName,
        clientEmail,
        clientPhone: clientPhone.length >= 7 ? clientPhone : "000-000-0000",
        notes,
        preferences,
        therapistLabel,
        payLater: true,
      });

      const statusRaw = (col.status >= 0 ? cells[col.status] : "").trim().toLowerCase();
      const status = mapImportStatus(statusRaw);
      if (status && status !== "booked") {
        await updateAppointment(appointment.id, { status });
      }

      const priceRaw = col.price >= 0 ? cells[col.price] : "";
      if (priceRaw) {
        const cents = dollarsToCents(priceRaw);
        if (cents != null) {
          await prisma.serviceAppointment.update({
            where: { id: appointment.id },
            data: { priceCents: cents },
          });
        }
      }
      created += 1;
    } catch (error) {
      skipped += 1;
      issues.push(
        `Row ${i + 1}: ${error instanceof PublicError ? error.message : "could not import."}`,
      );
    }
  }

  return { created, skipped, issues: issues.slice(0, 40) };
}

export function massageBookTemplateCsv() {
  return [
    "client_name,email,phone,service_key,service,date,time,price,status,notes,preferences,therapist",
    "Casey Client,casey@example.com,239-555-0100,swedish-50,50 min Swedish Massage,2026-12-15,2:00 PM,90.00,booked,Focus on shoulders,Medium pressure,Tabatha",
  ].join("\n");
}

async function assertSlotAvailable(input: {
  ventureId: string;
  appointmentOn: string;
  startsAtLabel: string;
  durationMinutes: number | null;
  excludeId?: string;
}) {
  const nextWindow = appointmentWindowMinutes(input.startsAtLabel, input.durationMinutes);
  if (!nextWindow) {
    throw new PublicError("Choose a valid appointment time.");
  }

  const existing = await prisma.serviceAppointment.findMany({
    where: {
      ventureId: input.ventureId,
      appointmentOn: input.appointmentOn,
      status: { in: ACTIVE_STATUSES },
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
  });

  for (const row of existing) {
    const window = appointmentWindowMinutes(row.startsAtLabel, row.durationMinutes);
    if (!window) continue;
    if (windowsOverlap(nextWindow, window)) {
      throw new PublicError(
        `That time overlaps ${row.clientName}'s ${row.serviceTitle} at ${row.startsAtLabel}.`,
      );
    }
  }
}

function toRecord(row: {
  id: string;
  guestId?: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceKey: string;
  serviceTitle: string;
  durationMinutes: number | null;
  priceCents: number;
  paymentStatus?: string | null;
  depositCents?: number | null;
  amountPaidCents?: number | null;
  paymentRef?: string | null;
  paymentBrand?: string | null;
  paymentLast4?: string | null;
  appointmentOn: string;
  startsAtLabel: string;
  status: string;
  therapistLabel?: string | null;
  notes: string | null;
  preferences?: string | null;
  staffNotes?: string | null;
  confirmationCode: string | null;
  confirmationSentAt?: Date | null;
  cancelledAt?: Date | null;
}): ServiceAppointmentRecord {
  const amountPaidCents = row.amountPaidCents ?? 0;
  const paymentStatus = row.paymentStatus ?? "unpaid";
  const balanceDueCents =
    paymentStatus === "refunded" || paymentStatus === "paid"
      ? 0
      : Math.max(0, row.priceCents - amountPaidCents);

  return {
    id: row.id,
    guestId: row.guestId ?? null,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    serviceKey: row.serviceKey,
    serviceTitle: row.serviceTitle || getSpaService(row.serviceKey)?.title || row.serviceKey,
    durationMinutes: row.durationMinutes,
    priceCents: row.priceCents,
    paymentStatus,
    depositCents: row.depositCents ?? 0,
    amountPaidCents,
    paymentRef: row.paymentRef ?? null,
    paymentBrand: row.paymentBrand ?? null,
    paymentLast4: row.paymentLast4 ?? null,
    appointmentOn: row.appointmentOn,
    startsAtLabel: row.startsAtLabel,
    status: row.status,
    therapistLabel: row.therapistLabel ?? null,
    notes: row.notes,
    preferences: row.preferences ?? null,
    staffNotes: row.staffNotes ?? null,
    confirmationCode: row.confirmationCode,
    confirmationSentAt: row.confirmationSentAt ? row.confirmationSentAt.toISOString() : null,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    balanceDueCents,
  };
}

async function nextAppointmentCode() {
  const year = new Date().getUTCFullYear();
  const total = await prisma.serviceAppointment.count();
  for (let offset = 0; offset < 32; offset += 1) {
    const code = `SA-${year}-${String(total + 1 + offset).padStart(4, "0")}`;
    const taken = await prisma.serviceAppointment.findUnique({ where: { confirmationCode: code } });
    if (!taken) return code;
  }
  return `SA-${year}-${Date.now().toString(36).toUpperCase()}`;
}

function emptyToNull(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function normalizeDate(raw: string) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return "";
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function normalizeTimeLabel(raw: string) {
  const trimmed = raw.trim();
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed)!;
    return `${Number(match[1])}:${match[2]} ${match[3].toUpperCase()}`;
  }
  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (twentyFour) {
    let hour = Number(twentyFour[1]);
    const minute = twentyFour[2];
    const meridiem = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${minute} ${meridiem}`;
  }
  return trimmed;
}

function dollarsToCents(raw: string) {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function mapImportStatus(raw: string): AppointmentStatus | null {
  if (!raw) return null;
  if (["booked", "scheduled", "confirmed"].includes(raw)) {
    return raw === "confirmed" ? "confirmed" : "booked";
  }
  if (["completed", "complete", "checked out", "checkout"].includes(raw)) return "completed";
  if (["no_show", "noshow", "no-show", "no show"].includes(raw)) return "no_show";
  if (["cancelled", "canceled"].includes(raw)) return "cancelled";
  return null;
}

function guessServiceKey(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("swedish") && lower.includes("80")) return "swedish-80";
  if (lower.includes("swedish") && lower.includes("100")) return "swedish-100";
  if (lower.includes("swedish")) return "swedish-50";
  if (lower.includes("deep")) return "deep-tissue";
  if (lower.includes("mini")) return "mini-20";
  if (lower.includes("facial")) return "facial";
  if (lower.includes("hot stone")) return "hot-stone-50";
  return "swedish-50";
}
