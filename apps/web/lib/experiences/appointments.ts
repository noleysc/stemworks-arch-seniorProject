/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSpaService, requireSpaService } from "@/lib/experiences/spa-menu";
import { ensurePamperedEvents } from "@/lib/tenancy";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required.")
  .max(40)
  .regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number.");

export const bookAppointmentSchema = z.object({
  serviceKey: z.string().trim().min(1, "Choose a service."),
  appointmentOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  startsAtLabel: z.string().trim().min(1, "Choose a time.").max(40),
  clientName: z.string().trim().min(1, "Name is required.").max(160),
  clientEmail: z.string().trim().email("A valid email is required.").max(200),
  clientPhone: phoneSchema,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ServiceAppointmentRecord = {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceKey: string;
  serviceTitle: string;
  durationMinutes: number | null;
  priceCents: number;
  appointmentOn: string;
  startsAtLabel: string;
  status: string;
  notes: string | null;
  confirmationCode: string | null;
};

export async function bookServiceAppointment(raw: z.input<typeof bookAppointmentSchema>) {
  const input = bookAppointmentSchema.parse(raw);
  const service = requireSpaService(input.serviceKey);
  if (service.menuPriceCents == null) {
    throw new Error("That service needs a quoted price — call the spa to book it.");
  }

  const venture = await ensurePamperedEvents();
  const email = input.clientEmail.toLowerCase();
  const guest = await prisma.guestProfile.upsert({
    where: { email },
    update: {
      fullName: input.clientName,
      phone: input.clientPhone.trim(),
    },
    create: {
      email,
      fullName: input.clientName,
      phone: input.clientPhone.trim(),
    },
  });

  const confirmationCode = await nextAppointmentCode();
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
      priceCents: service.menuPriceCents,
      appointmentOn: input.appointmentOn,
      startsAtLabel: input.startsAtLabel,
      status: "booked",
      notes: emptyToNull(input.notes),
      confirmationCode,
    },
  });

  return toRecord(appointment);
}

export async function listAppointments(range?: { from?: string; to?: string }) {
  const venture = await ensurePamperedEvents();
  const rows = await prisma.serviceAppointment.findMany({
    where: {
      ventureId: venture.id,
      status: { not: "cancelled" },
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

function toRecord(row: {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceKey: string;
  serviceTitle: string;
  durationMinutes: number | null;
  priceCents: number;
  appointmentOn: string;
  startsAtLabel: string;
  status: string;
  notes: string | null;
  confirmationCode: string | null;
}): ServiceAppointmentRecord {
  return {
    id: row.id,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    serviceKey: row.serviceKey,
    serviceTitle: row.serviceTitle || getSpaService(row.serviceKey)?.title || row.serviceKey,
    durationMinutes: row.durationMinutes,
    priceCents: row.priceCents,
    appointmentOn: row.appointmentOn,
    startsAtLabel: row.startsAtLabel,
    status: row.status,
    notes: row.notes,
    confirmationCode: row.confirmationCode,
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
