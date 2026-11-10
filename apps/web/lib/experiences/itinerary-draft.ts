/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { requireSpaService, THROUGHOUT_LABEL } from "@/lib/experiences/spa-menu";

export const itineraryDraftSchema = z
  .object({
    serviceKey: z.string().trim().max(80).optional().or(z.literal("")),
    startsAtLabel: z.string().trim().max(40).optional().or(z.literal("")),
    title: z.string().trim().max(120).optional().or(z.literal("")),
    detail: z.string().trim().max(280).optional().or(z.literal("")),
    placeLabel: z.string().trim().max(120).optional().or(z.literal("")),
    emoji: z.string().trim().max(8).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (!value.serviceKey && !value.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a spa service or type a custom itinerary title.",
        path: ["title"],
      });
    }
  });

export type ItineraryDraft = z.infer<typeof itineraryDraftSchema>;

export type ResolvedItineraryItem = {
  serviceKey: string | null;
  startsAtLabel: string;
  title: string;
  detail: string | null;
  placeLabel: string | null;
  emoji: string | null;
  durationMinutes: number | null;
  menuPriceCents: number | null;
  category: string | null;
};

export function resolveItineraryDraft(raw: ItineraryDraft): ResolvedItineraryItem {
  const input = itineraryDraftSchema.parse(raw);
  const time = input.startsAtLabel?.trim() || THROUGHOUT_LABEL;

  if (input.serviceKey) {
    const service = requireSpaService(input.serviceKey);
    return {
      serviceKey: service.key,
      startsAtLabel: time,
      title: input.title?.trim() || service.title,
      detail: emptyToNull(input.detail) ?? service.detail,
      placeLabel: emptyToNull(input.placeLabel) ?? service.placeLabel,
      emoji: emptyToNull(input.emoji) ?? service.emoji,
      durationMinutes: service.durationMinutes,
      menuPriceCents: service.menuPriceCents,
      category: service.category,
    };
  }

  return {
    serviceKey: null,
    startsAtLabel: time,
    title: input.title!.trim(),
    detail: emptyToNull(input.detail),
    placeLabel: emptyToNull(input.placeLabel),
    emoji: emptyToNull(input.emoji),
    durationMinutes: null,
    menuPriceCents: null,
    category: "moment",
  };
}

function emptyToNull(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
