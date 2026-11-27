/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

export const APPOINTMENT_STATUSES = [
  { key: "booked", label: "Booked" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "no_show", label: "No show" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export const PAYMENT_STATUSES = [
  { key: "unpaid", label: "Unpaid" },
  { key: "deposit", label: "Deposit" },
  { key: "paid", label: "Paid" },
  { key: "refunded", label: "Refunded" },
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]["key"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["key"];

export type ServiceAppointmentRecord = {
  id: string;
  guestId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceKey: string;
  serviceTitle: string;
  durationMinutes: number | null;
  priceCents: number;
  paymentStatus: PaymentStatus | string;
  depositCents: number;
  amountPaidCents: number;
  paymentRef: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  appointmentOn: string;
  startsAtLabel: string;
  status: AppointmentStatus | string;
  therapistLabel: string | null;
  notes: string | null;
  preferences: string | null;
  staffNotes: string | null;
  confirmationCode: string | null;
  confirmationSentAt: string | null;
  cancelledAt: string | null;
  balanceDueCents: number;
};

export type SpaClientRecord = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  preferences: string | null;
  spaNotes: string | null;
  appointmentCount: number;
  lastAppointmentOn: string | null;
  appointments: ServiceAppointmentRecord[];
};

export type SpaAppointmentReport = {
  from: string | null;
  to: string | null;
  totalAppointments: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  bookedRevenueCents: number;
  collectedCents: number;
  outstandingCents: number;
  completedCount: number;
  noShowCount: number;
  cancelledCount: number;
};

export function appointmentStatusLabel(status: string) {
  return APPOINTMENT_STATUSES.find((item) => item.key === status)?.label ?? status;
}

export function paymentStatusLabel(status: string) {
  return PAYMENT_STATUSES.find((item) => item.key === status)?.label ?? status;
}
