/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { formatTicketPrice } from "@/lib/experiences/catalog";
import { PublicError } from "@/lib/experiences/errors";

export const SPA_MENU_CATEGORIES = [
  { key: "massage", label: "Massage" },
  { key: "skin", label: "Skin & facials" },
  { key: "combo", label: "Combos" },
  { key: "specialty", label: "Specialty" },
] as const;

export type SpaMenuCategory = (typeof SPA_MENU_CATEGORIES)[number]["key"];

export type SpaService = {
  key: string;
  category: SpaMenuCategory;
  title: string;
  detail: string;
  durationMinutes: number | null;
  menuPriceCents: number | null;
  placeLabel: string;
  emoji: string;
};

const SPA_FLOOR = "Treatment room · The Pampered Soul";

/** Live Pampered Soul Spa & Massage menu (Fort Myers). */
export const SPA_SERVICES: SpaService[] = [
  {
    key: "swedish-50",
    category: "massage",
    title: "50 min Swedish Massage",
    detail:
      "Smooth gliding strokes with oil or cream. Firm but gentle pressure to ease tension and settle the nervous system.",
    durationMinutes: 50,
    menuPriceCents: 9000,
    placeLabel: SPA_FLOOR,
    emoji: "🫧",
  },
  {
    key: "swedish-80",
    category: "massage",
    title: "80 min Swedish Massage",
    detail: "The longer Swedish session — more time on back, neck, and hips without rushing the close.",
    durationMinutes: 80,
    menuPriceCents: 15000,
    placeLabel: SPA_FLOOR,
    emoji: "🫧",
  },
  {
    key: "swedish-100",
    category: "massage",
    title: "100 min Swedish Massage",
    detail: "Full-body Swedish with extra time for the areas that actually need it.",
    durationMinutes: 100,
    menuPriceCents: 20000,
    placeLabel: SPA_FLOOR,
    emoji: "🫧",
  },
  {
    key: "throwback-thursday",
    category: "massage",
    title: "Throwback Thursday Swedish",
    detail: "50-minute Swedish, Thursday-only spa special.",
    durationMinutes: 50,
    menuPriceCents: 6000,
    placeLabel: SPA_FLOOR,
    emoji: "🗓️",
  },
  {
    key: "mini-20",
    category: "massage",
    title: "Mini Session · Problem Area",
    detail:
      "Twenty minutes on one chronic spot. Built for guests who want to come in a few times a week until it moves.",
    durationMinutes: 20,
    menuPriceCents: 4500,
    placeLabel: SPA_FLOOR,
    emoji: "🎯",
  },
  {
    key: "foot-30",
    category: "massage",
    title: "Foot Massage",
    detail: "Thirty minutes on feet and lower legs.",
    durationMinutes: 30,
    menuPriceCents: 4500,
    placeLabel: SPA_FLOOR,
    emoji: "🦶",
  },
  {
    key: "deep-tissue",
    category: "massage",
    title: "Deep Tissue Massage",
    detail: "Slower, denser work for tight tissue. Confirm pressure and length with the therapist.",
    durationMinutes: 50,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "💪",
  },
  {
    key: "hot-stone-50",
    category: "massage",
    title: "Hot Stone Massage",
    detail: "Heated stones to melt tension and lift circulation. Offered as a 50-minute full-body treatment.",
    durationMinutes: 50,
    menuPriceCents: 14000,
    placeLabel: SPA_FLOOR,
    emoji: "🔥",
  },
  {
    key: "back-renewal",
    category: "skin",
    title: "Back Renewal · Signature Back Facial",
    detail: "The spa's signature back facial: cleanse, exfoliate, hydrate, and nourish the skin most people ignore.",
    durationMinutes: 50,
    menuPriceCents: 9000,
    placeLabel: SPA_FLOOR,
    emoji: "🧖",
  },
  {
    key: "facial",
    category: "skin",
    title: "Custom Facial",
    detail: "Skin treatment tailored on the table. Length and products confirmed when the owner books the room.",
    durationMinutes: 50,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "✨",
  },
  {
    key: "microdermabrasion",
    category: "skin",
    title: "Microdermabrasion",
    detail: "Mechanical exfoliation for dull or congested skin. Pair with a facial if the itinerary has the time.",
    durationMinutes: 45,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "💎",
  },
  {
    key: "dermaplaning",
    category: "skin",
    title: "Dermaplaning",
    detail: "Physical exfoliation that lifts peach fuzz and surface dullness.",
    durationMinutes: 45,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "🪞",
  },
  {
    key: "combo-90",
    category: "combo",
    title: "Massage + Facial Combo",
    detail: "Ninety minutes split between bodywork and a facial — the spa's published combo.",
    durationMinutes: 90,
    menuPriceCents: 15000,
    placeLabel: SPA_FLOOR,
    emoji: "🌸",
  },
  {
    key: "medical-90",
    category: "specialty",
    title: "Medical Massage · First Visit",
    detail:
      "Assessment-first session: history, posture and movement, then hands-on work aimed at the source of pain.",
    durationMinutes: 90,
    menuPriceCents: 17000,
    placeLabel: SPA_FLOOR,
    emoji: "🩺",
  },
  {
    key: "lymphatic-50",
    category: "specialty",
    title: "Lymphatic Drainage",
    detail: "Very light work that directs lymph toward the nodes. Gentle on purpose — not a deep-tissue swap.",
    durationMinutes: 50,
    menuPriceCents: 11000,
    placeLabel: SPA_FLOOR,
    emoji: "💧",
  },
  {
    key: "oncology",
    category: "specialty",
    title: "Oncology Massage",
    detail: "Adapted pressure and positioning for guests in or after cancer treatment. Ask the owner before listing.",
    durationMinutes: 50,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "🤍",
  },
  {
    key: "aroma-touch",
    category: "specialty",
    title: "Aroma Touch",
    detail: "Essential-oil application along the back, neck, and feet. Soft and aromatic, not a sports massage.",
    durationMinutes: 50,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "🌿",
  },
  {
    key: "couples",
    category: "specialty",
    title: "Couples Massage",
    detail: "Side-by-side tables. Not on the public menu — the owner confirms rooms and therapists when they add it.",
    durationMinutes: 50,
    menuPriceCents: null,
    placeLabel: SPA_FLOOR,
    emoji: "🤍",
  },
];

const byKey = new Map(SPA_SERVICES.map((service) => [service.key, service]));

export function getSpaService(key: string): SpaService | null {
  return byKey.get(key) ?? null;
}

export function requireSpaService(key: string): SpaService {
  const service = getSpaService(key);
  if (!service) throw new PublicError("That treatment is no longer available. Refresh the spa menu and choose another treatment.");
  return service;
}

export function spaServicesByCategory() {
  return SPA_MENU_CATEGORIES.map((category) => ({
    ...category,
    services: SPA_SERVICES.filter((service) => service.category === category.key),
  })).filter((group) => group.services.length > 0);
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return null;
  return `${minutes} min`;
}

export function formatMenuPrice(cents: number | null | undefined) {
  if (cents == null) return "Ask for price";
  return formatTicketPrice(cents);
}

export const THROUGHOUT_LABEL = "Throughout";
