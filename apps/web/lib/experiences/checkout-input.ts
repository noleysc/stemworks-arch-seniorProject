/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

/** Guest details shared by the checkout form and the server; safe to import in the browser. */
export const registrationDetailsSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required.").max(160),
  email: z.string().trim().email("A valid email is required.").max(200),
  phone: z.string().trim().min(7, "Phone number is required.").max(40)
    .regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number."),
  tierKey: z.string().trim().min(1, "Choose a ticket."),
  ticketQuantity: z.coerce.number().int().min(1).max(8).default(1),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  guestNote: z.string().trim().max(120).optional().or(z.literal("")),
  showOnGuestWall: z.boolean().default(true),
  networkOptIn: z.boolean().default(false),
  vendorOptIns: z.record(z.string(), z.boolean()).default({}),
});

export type RegistrationDetails = z.infer<typeof registrationDetailsSchema>;
