/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const cardPaymentSchema = z.object({
  cardholderName: z.string().trim().min(2, "Cardholder name is required.").max(120),
  cardNumber: z.string().trim().min(12).max(23),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2026).max(2100),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter a valid CVC."),
});

export type CardPaymentInput = z.infer<typeof cardPaymentSchema>;

export type ChargeResult = {
  paymentRef: string;
  brand: string;
  last4: string;
  amountCents: number;
  mode: "stripe" | "demo";
  paidAt: Date;
};

export function paymentMode(): "stripe" | "demo" {
  return process.env.STRIPE_SECRET_KEY?.trim() ? "stripe" : "demo";
}

/** Charge for tickets. Never persists the full card number. $0 tickets need no card. */
export async function chargeTicketPayment(input: {
  amountCents: number;
  email: string;
  phone: string;
  fullName: string;
  description: string;
  card?: CardPaymentInput | null;
}): Promise<ChargeResult> {
  if (input.amountCents < 0) {
    throw new Error("Ticket total cannot be negative.");
  }
  if (input.amountCents === 0) {
    return {
      paymentRef: `comp_free_${createHash("sha256")
        .update(`${input.email}:${input.description}:${randomBytes(6).toString("hex")}`)
        .digest("hex")
        .slice(0, 20)}`,
      brand: "complimentary",
      last4: "",
      amountCents: 0,
      mode: paymentMode(),
      paidAt: new Date(),
    };
  }

  if (!input.card) {
    throw new Error("Payment is required for paid tickets.");
  }

  const card = cardPaymentSchema.parse(input.card);
  const number = digitsOnly(card.cardNumber);
  if (!luhnValid(number)) throw new Error("That card number is invalid.");
  assertNotExpired(card.expMonth, card.expYear);

  const brand = detectBrand(number);
  const last4 = number.slice(-4);

  if (paymentMode() === "stripe") {
    return chargeWithStripe({
      amountCents: input.amountCents,
      email: input.email,
      phone: input.phone,
      fullName: input.fullName,
      description: input.description,
      card,
      brand,
      last4,
      number,
    });
  }

  return chargeDemo({
    amountCents: input.amountCents,
    number,
    brand,
    last4,
    cvc: card.cvc,
  });
}

async function chargeWithStripe(input: {
  amountCents: number;
  email: string;
  phone: string;
  fullName: string;
  description: string;
  card: CardPaymentInput;
  brand: string;
  last4: string;
  number: string;
}): Promise<ChargeResult> {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: input.number,
      exp_month: input.card.expMonth,
      exp_year: input.card.expYear,
      cvc: input.card.cvc,
    },
    billing_details: {
      name: input.card.cardholderName || input.fullName,
      email: input.email,
      phone: input.phone,
    },
  });

  const intent = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: "usd",
    confirm: true,
    description: input.description,
    receipt_email: input.email,
    payment_method: paymentMethod.id,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  if (intent.status !== "succeeded") {
    throw new Error(`Payment was not completed (${intent.status}).`);
  }

  return {
    paymentRef: intent.id,
    brand: input.brand,
    last4: input.last4,
    amountCents: input.amountCents,
    mode: "stripe",
    paidAt: new Date(),
  };
}

function chargeDemo(input: {
  amountCents: number;
  number: string;
  brand: string;
  last4: string;
  cvc: string;
}): ChargeResult {
  // Decline classic Stripe test decline cards in demo so failures are exercisable.
  if (input.number === "4000000000000002") {
    throw new Error("Your card was declined.");
  }
  if (!/^4\d{12,18}$/.test(input.number) && !/^5[1-5]\d{14}$/.test(input.number)) {
    throw new Error("Demo checkout accepts Visa or Mastercard test numbers (e.g. 4242 4242 4242 4242).");
  }
  if (input.cvc === "000") throw new Error("Your card was declined.");

  const paymentRef = `pay_demo_${createHash("sha256")
    .update(`${input.last4}:${input.amountCents}:${randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 24)}`;

  return {
    paymentRef,
    brand: input.brand,
    last4: input.last4,
    amountCents: input.amountCents,
    mode: "demo",
    paidAt: new Date(),
  };
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function luhnValid(number: string) {
  if (!/^\d{12,19}$/.test(number)) return false;
  let sum = 0;
  let alt = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let n = Number(number[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function assertNotExpired(month: number, year: number) {
  const now = new Date();
  const exp = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  if (exp < now) throw new Error("That card is expired.");
}

function detectBrand(number: string) {
  if (/^4/.test(number)) return "visa";
  if (/^5[1-5]/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  return "card";
}
