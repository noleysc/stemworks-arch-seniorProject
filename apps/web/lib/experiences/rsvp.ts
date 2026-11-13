/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { wallFirstName } from "@/lib/experiences/catalog";
import { cardPaymentSchema, chargeTicketPayment, paymentMode } from "@/lib/experiences/payments";
import { ensurePamperedEvents } from "@/lib/tenancy";
import { PublicError } from "@/lib/experiences/errors";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required.")
  .max(40)
  .regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number.");

export const rsvpInputSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required.").max(160),
  email: z.string().trim().email("A valid email is required.").max(200),
  phone: phoneSchema,
  tierKey: z.string().trim().min(1, "Choose a ticket."),
  ticketQuantity: z.coerce.number().int().min(1).max(8).default(1),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  guestNote: z.string().trim().max(120).optional().or(z.literal("")),
  showOnGuestWall: z.boolean().default(true),
  networkOptIn: z.boolean().default(false),
  /**
   * businessKey → marketing consent.
   * true means the guest grants that business marketing consent (email + SMS).
   */
  vendorOptIns: z.record(z.string(), z.boolean()).default({}),
  /** Required when the ticket total is greater than $0. Omitted for free tickets. */
  payment: cardPaymentSchema.optional(),
});

export async function submitRsvp(slug: string, raw: z.input<typeof rsvpInputSchema>) {
  const input = rsvpInputSchema.parse(raw);
  const event = await prisma.experienceEvent.findUnique({
    where: { slug },
    include: {
      vendors: true,
      tiers: true,
      registrations: {
        where: { status: { not: "cancelled" } },
        select: { id: true, ticketQuantity: true, tierId: true },
      },
    },
  });
  if (!event) throw new PublicError("That invite is not available. Check the link with the organizer.", 404);
  return purchaseTickets(event, input);
}

async function purchaseTickets(
  event: {
    id: string;
    slug: string;
    title: string;
    capacity: number;
    status: string;
    disclosureText: string;
    vendors: { id: string; businessKey: string; displayName: string }[];
    tiers: {
      id: string;
      key: string;
      priceCents: number;
      quantityAvailable: number;
      isActive: boolean;
      label: string;
    }[];
    registrations: { id: string; ticketQuantity: number; tierId: string | null }[];
  },
  input: z.infer<typeof rsvpInputSchema>,
) {
  if (event.status !== "open") throw new PublicError("Tickets are sold out or closed for this event.", 409);

  const tier = event.tiers.find((item) => item.key === input.tierKey && item.isActive);
  if (!tier) throw new PublicError("That ticket type is no longer available. Choose another ticket type.", 409);

  const ticketsSold = event.registrations.reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  if (ticketsSold + input.ticketQuantity > event.capacity) {
    throw new PublicError("There aren’t enough tickets left for that quantity. Choose fewer tickets.", 409);
  }

  const soldInTier = event.registrations
    .filter((reg) => reg.tierId === tier.id)
    .reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  if (soldInTier + input.ticketQuantity > tier.quantityAvailable) {
    throw new PublicError("There aren’t enough tickets left in that ticket type. Choose fewer tickets or another type.", 409);
  }

  const email = input.email.toLowerCase();
  const phone = input.phone.trim();
  const amountDueCents = tier.priceCents * input.ticketQuantity;

  const guest = await prisma.guestProfile.upsert({
    where: { email },
    update: {
      fullName: input.fullName,
      phone,
      networkOptIn: input.networkOptIn,
    },
    create: {
      email,
      fullName: input.fullName,
      phone,
      networkOptIn: input.networkOptIn,
    },
  });

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_guestId: { eventId: event.id, guestId: guest.id } },
  });
  if (existing && existing.status !== "cancelled") {
    throw new PublicError("You already have tickets for this event. Contact the organizer if you need help.", 409);
  }

  if (amountDueCents > 0 && !input.payment) {
    throw new PublicError("Payment is required for paid tickets. Enter your card details.");
  }

  const charge = await chargeTicketPayment({
    amountCents: amountDueCents,
    email,
    phone,
    fullName: input.fullName,
    description: `${event.title} · ${tier.label} × ${input.ticketQuantity}`,
    card: amountDueCents > 0 ? input.payment : null,
  });

  const registrationData = {
    status: "confirmed" as const,
    partySize: input.ticketQuantity,
    ticketQuantity: input.ticketQuantity,
    amountDueCents,
    amountPaidCents: charge.amountCents,
    paymentRef: charge.paymentRef,
    paymentStatus: amountDueCents === 0 ? "comped" : "paid",
    paymentBrand: charge.last4 ? charge.brand : null,
    paymentLast4: charge.last4 || null,
    paidAt: charge.paidAt,
    tierId: tier.id,
    showOnGuestWall: input.showOnGuestWall,
    wallName: wallFirstName(input.fullName),
    guestNote: emptyToNull(input.guestNote),
    notes: emptyToNull(input.notes),
    checkedInAt: null,
  };

  const registration = await saveRegistrationWithUniqueCode({
    existingId: existing?.id ?? null,
    eventId: event.id,
    guestId: guest.id,
    data: registrationData,
  });
  const confirmationCode = registration.confirmationCode!;

  for (const vendor of event.vendors) {
    const granted = Boolean(input.vendorOptIns[vendor.businessKey]);
    await prisma.vendorConsent.upsert({
      where: { registrationId_vendorId: { registrationId: registration.id, vendorId: vendor.id } },
      update: {
        granted,
        revokedAt: granted ? null : new Date(),
        source: "rsvp",
        guestId: guest.id,
        channelScope: "marketing",
      },
      create: {
        registrationId: registration.id,
        vendorId: vendor.id,
        guestId: guest.id,
        granted,
        channelScope: "marketing",
        source: "rsvp",
      },
    });

    await prisma.consentAudit.create({
      data: {
        guestId: guest.id,
        businessKey: vendor.businessKey,
        action: granted ? "grant_marketing" : "decline_marketing",
        channelScope: "marketing",
        source: "rsvp",
        disclosure: event.disclosureText,
      },
    });

    if (granted) {
      await upsertCrmContact({
        businessKey: vendor.businessKey,
        guestId: guest.id,
        fullName: input.fullName,
        email,
        phone,
        sourceEventId: event.id,
        sourceVendorId: vendor.id,
      });
    }
  }

  if (ticketsSold + input.ticketQuantity >= event.capacity) {
    await prisma.experienceEvent.update({ where: { id: event.id }, data: { status: "full" } });
  }

  return {
    registrationId: registration.id,
    guestId: guest.id,
    eventSlug: event.slug,
    confirmationCode,
    amountPaidCents: charge.amountCents,
    ticketQuantity: input.ticketQuantity,
    tierLabel: tier.label,
    paymentRef: charge.paymentRef,
    paymentBrand: charge.last4 ? charge.brand : null,
    paymentLast4: charge.last4 || null,
    paymentMode: charge.mode || paymentMode(),
  };
}

export async function revokeVendorConsent(input: {
  guestEmail: string;
  businessKey: string;
  source?: string;
}) {
  const guest = await prisma.guestProfile.findUnique({
    where: { email: input.guestEmail.toLowerCase() },
  });
  if (!guest) throw new PublicError("No guest was found with that email address. Check the address and try again.", 404);

  const consents = await prisma.vendorConsent.findMany({
    where: {
      guestId: guest.id,
      vendor: { businessKey: input.businessKey },
      granted: true,
      revokedAt: null,
    },
    include: { vendor: true },
  });

  for (const consent of consents) {
    await prisma.vendorConsent.update({
      where: { id: consent.id },
      data: { granted: false, revokedAt: new Date() },
    });
  }

  const contacts = await prisma.businessCrmContact.findMany({
    where: { guestId: guest.id, businessKey: input.businessKey, status: "active" },
  });
  for (const contact of contacts) {
    await prisma.businessCrmContact.update({
      where: { id: contact.id },
      data: {
        status: "revoked",
        email: null,
        phone: null,
        followUpStatus: "none",
        lastInteraction: "Marketing consent revoked by guest",
      },
    });
  }

  await prisma.consentAudit.create({
    data: {
      guestId: guest.id,
      businessKey: input.businessKey,
      action: "revoke_marketing",
      channelScope: "marketing",
      source: input.source ?? "preference_center",
    },
  });

  return { revokedConsents: consents.length, archivedContacts: contacts.length };
}

async function upsertCrmContact(input: {
  businessKey: string;
  guestId: string;
  fullName: string;
  email: string;
  phone: string;
  sourceEventId: string;
  sourceVendorId: string;
}) {
  const venture = await ensurePamperedEvents();

  return prisma.businessCrmContact.upsert({
    where: {
      ventureId_businessKey_guestId: {
        ventureId: venture.id,
        businessKey: input.businessKey,
        guestId: input.guestId,
      },
    },
    update: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      status: "active",
      sourceEventId: input.sourceEventId,
      sourceVendorId: input.sourceVendorId,
      lastInteraction: "Granted marketing consent at ticket purchase",
    },
    create: {
      ventureId: venture.id,
      businessKey: input.businessKey,
      guestId: input.guestId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      status: "active",
      followUpStatus: "queued",
      sourceEventId: input.sourceEventId,
      sourceVendorId: input.sourceVendorId,
      lastInteraction: "Granted marketing consent at ticket purchase",
    },
  });
}

async function nextConfirmationCode() {
  const year = new Date().getUTCFullYear();
  const total = await prisma.eventRegistration.count();
  let candidate = total + 1;

  for (let i = 0; i < 32; i++) {
    const code = `PS-${year}-${String(candidate).padStart(4, "0")}`;
    const taken = await prisma.eventRegistration.findFirst({
      where: { confirmationCode: code },
      select: { id: true },
    });
    if (!taken) return code;
    candidate += 1;
  }

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return `PS-${year}-${suffix}`;
}

async function saveRegistrationWithUniqueCode(input: {
  existingId: string | null;
  eventId: string;
  guestId: string;
  data: {
    status: "confirmed";
    partySize: number;
    ticketQuantity: number;
    amountDueCents: number;
    amountPaidCents: number;
    paymentRef: string | null;
    paymentStatus: string;
    paymentBrand: string | null;
    paymentLast4: string | null;
    paidAt: Date | null;
    tierId: string;
    showOnGuestWall: boolean;
    wallName: string;
    guestNote: string | null;
    notes: string | null;
    checkedInAt: null;
  };
}) {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const confirmationCode = await nextConfirmationCode();
    try {
      if (input.existingId) {
        return await prisma.eventRegistration.update({
          where: { id: input.existingId },
          data: { ...input.data, confirmationCode },
        });
      }
      return await prisma.eventRegistration.create({
        data: {
          eventId: input.eventId,
          guestId: input.guestId,
          ...input.data,
          confirmationCode,
        },
      });
    } catch (error) {
      if (!isPrismaUniqueConflict(error) || attempt === maxAttempts - 1) throw error;
    }
  }
  throw new Error("Unable to allocate a unique confirmation code.");
}

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

function emptyToNull(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
