/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { wallFirstName } from "@/lib/experiences/catalog";
import { cardPaymentSchema, chargeTicketPayment, paymentMode } from "@/lib/experiences/payments";
import { ensurePamperedEvents } from "@/lib/tenancy";

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
  payment: cardPaymentSchema,
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
  if (!event) throw new Error("That event is not published.");
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
  if (event.status !== "open") throw new Error("Tickets are sold out or closed for this event.");

  const tier = event.tiers.find((item) => item.key === input.tierKey && item.isActive);
  if (!tier) throw new Error("That ticket tier is not available.");

  const ticketsSold = event.registrations.reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  if (ticketsSold + input.ticketQuantity > event.capacity) {
    throw new Error("Not enough seats left for that quantity.");
  }

  const soldInTier = event.registrations
    .filter((reg) => reg.tierId === tier.id)
    .reduce((sum, reg) => sum + reg.ticketQuantity, 0);
  if (soldInTier + input.ticketQuantity > tier.quantityAvailable) {
    throw new Error(`${tier.label} does not have enough tickets left.`);
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
    throw new Error("You already have tickets for this event.");
  }

  const charge = await chargeTicketPayment({
    amountCents: amountDueCents,
    email,
    phone,
    fullName: input.fullName,
    description: `${event.title} · ${tier.label} × ${input.ticketQuantity}`,
    card: input.payment,
  });

  const confirmationCode = await nextConfirmationCode(event.id);

  const registrationData = {
    status: "confirmed" as const,
    partySize: input.ticketQuantity,
    ticketQuantity: input.ticketQuantity,
    amountDueCents,
    amountPaidCents: charge.amountCents,
    confirmationCode,
    paymentRef: charge.paymentRef,
    paymentStatus: "paid",
    paymentBrand: charge.brand,
    paymentLast4: charge.last4,
    paidAt: charge.paidAt,
    tierId: tier.id,
    showOnGuestWall: input.showOnGuestWall,
    wallName: wallFirstName(input.fullName),
    guestNote: emptyToNull(input.guestNote),
    notes: emptyToNull(input.notes),
    checkedInAt: null,
  };

  const registration = existing
    ? await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: registrationData,
      })
    : await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          guestId: guest.id,
          ...registrationData,
        },
      });

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
    paymentBrand: charge.brand,
    paymentLast4: charge.last4,
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
  if (!guest) throw new Error("Guest profile not found.");

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

async function nextConfirmationCode(eventId: string) {
  const count = await prisma.eventRegistration.count({ where: { eventId } });
  const seq = String(count + 1).padStart(4, "0");
  return `PS-${new Date().getUTCFullYear()}-${seq}`;
}

function emptyToNull(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
