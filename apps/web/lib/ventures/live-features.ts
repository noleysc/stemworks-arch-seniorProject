/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/**
 * Maps venture blueprint features onto live desk routes and nav.
 */

import type { NavItem } from "@/lib/auth/roles";
import { ventureFromPathname, type VentureKey } from "@/lib/auth/ventures";
import {
  type FeatureKey,
  type MetricKey,
  type VentureBlueprint,
  isFeatureKey,
} from "@/lib/ventures/blueprint";

export const FEATURES_COOKIE = "stemworks_features";

export type FeaturesSnapshot = {
  byVenture: Partial<Record<VentureKey, FeatureKey[]>>;
  byBlueprint: Record<string, FeatureKey[]>;
  metricsByVenture: Partial<Record<VentureKey, MetricKey[]>>;
};

export const DEFAULT_FEATURES: Record<VentureKey, FeatureKey[]> = {
  luminary: ["hotel", "connect"],
  diaz_ventures: ["product", "atelier", "connect"],
  pampered_soul: ["spa_bookings", "ticketed_events", "crm_consent"],
};

const LINKED_IDS: Record<string, VentureKey> = {
  bp_luminary: "luminary",
  bp_jade: "diaz_ventures",
  bp_pampered: "pampered_soul",
};

export function linkedVentureForBlueprint(blueprint: VentureBlueprint): VentureKey | null {
  if (blueprint.linkedVentureKey) return blueprint.linkedVentureKey;
  return LINKED_IDS[blueprint.id] ?? null;
}

export function deskHrefForBlueprint(blueprint: VentureBlueprint): string {
  const linked = linkedVentureForBlueprint(blueprint);
  if (linked === "luminary") return "/luminary";
  if (linked === "diaz_ventures") return "/jade";
  if (linked === "pampered_soul") return "/thepamperedsoul";
  return `/v/${blueprint.id}`;
}

export function snapshotFromBlueprints(blueprints: VentureBlueprint[]): FeaturesSnapshot {
  const byVenture: FeaturesSnapshot["byVenture"] = {
    luminary: [...DEFAULT_FEATURES.luminary],
    diaz_ventures: [...DEFAULT_FEATURES.diaz_ventures],
    pampered_soul: [...DEFAULT_FEATURES.pampered_soul],
  };
  const metricsByVenture: FeaturesSnapshot["metricsByVenture"] = {};
  const byBlueprint: Record<string, FeatureKey[]> = {};

  for (const blueprint of blueprints) {
    byBlueprint[blueprint.id] = [...blueprint.features];
    const linked = linkedVentureForBlueprint(blueprint);
    if (linked) {
      byVenture[linked] = [...blueprint.features];
      metricsByVenture[linked] = [...blueprint.metricOrder];
    }
  }

  return { byVenture, byBlueprint, metricsByVenture };
}

export function parseFeaturesCookie(raw: string | undefined): FeaturesSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FeaturesSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      byVenture: parsed.byVenture ?? {},
      byBlueprint: parsed.byBlueprint ?? {},
      metricsByVenture: parsed.metricsByVenture ?? {},
    };
  } catch {
    return null;
  }
}

export function featuresForVenture(
  snapshot: FeaturesSnapshot | null,
  venture: VentureKey,
): FeatureKey[] {
  if (!snapshot) return DEFAULT_FEATURES[venture];
  const fromSnap = snapshot.byVenture?.[venture];
  // Empty array is intentional (all features off) — do not fall open to defaults.
  if (fromSnap !== undefined) return fromSnap.filter(isFeatureKey);
  return DEFAULT_FEATURES[venture];
}

export function featuresForBlueprint(
  snapshot: FeaturesSnapshot | null,
  blueprintId: string,
  fallback: FeatureKey[] = ["product"],
): FeatureKey[] {
  if (!snapshot) return fallback;
  const fromSnap = snapshot.byBlueprint?.[blueprintId];
  if (fromSnap !== undefined) return fromSnap.filter(isFeatureKey);
  return fallback;
}

export function hasFeature(features: FeatureKey[], required: FeatureKey | FeatureKey[]): boolean {
  const need = Array.isArray(required) ? required : [required];
  return need.some((key) => features.includes(key));
}

/**
 * Which feature(s) a path needs. null = not feature-gated.
 * Array means any one is enough.
 */
export function featureRequirementForPath(pathname: string): FeatureKey | FeatureKey[] | null {
  if (pathname.startsWith("/luminary")) return "hotel";
  if (pathname.startsWith("/jade")) return "product";

  if (pathname === "/book" || pathname.startsWith("/book/")) return "spa_bookings";
  if (pathname.startsWith("/e/")) return "ticketed_events";

  if (pathname.startsWith("/thepamperedsoul/crm") || pathname.startsWith("/thepamperedsoul/scorecard")) {
    return "crm_consent";
  }
  if (pathname.startsWith("/thepamperedsoul/bookings")) return "spa_bookings";
  if (
    pathname.startsWith("/thepamperedsoul/events") ||
    pathname.startsWith("/thepamperedsoul/new") ||
    pathname.startsWith("/thepamperedsoul/guests")
  ) {
    return "ticketed_events";
  }
  if (pathname.startsWith("/thepamperedsoul/calendar")) {
    return ["spa_bookings", "ticketed_events"];
  }
  if (pathname === "/thepamperedsoul" || pathname.startsWith("/thepamperedsoul/")) {
    // Event slug pages under the desk
    if (
      pathname !== "/thepamperedsoul" &&
      !pathname.startsWith("/thepamperedsoul/calendar") &&
      !pathname.startsWith("/thepamperedsoul/bookings") &&
      !pathname.startsWith("/thepamperedsoul/crm") &&
      !pathname.startsWith("/thepamperedsoul/scorecard") &&
      !pathname.startsWith("/thepamperedsoul/events") &&
      !pathname.startsWith("/thepamperedsoul/new") &&
      !pathname.startsWith("/thepamperedsoul/guests")
    ) {
      return "ticketed_events";
    }
    return ["spa_bookings", "ticketed_events", "crm_consent"];
  }

  if (pathname.startsWith("/v/")) return null; // custom desk checks its own blueprint
  return null;
}

export function pathAllowedByFeatures(
  pathname: string,
  venture: VentureKey,
  snapshot: FeaturesSnapshot | null,
): boolean {
  const required = featureRequirementForPath(pathname);
  if (!required) return true;
  return hasFeature(featuresForVenture(snapshot, venture), required);
}

const HREF_FEATURE: Array<{ test: (href: string) => boolean; feature: FeatureKey | FeatureKey[] }> = [
  { test: (h) => h.startsWith("/luminary"), feature: "hotel" },
  { test: (h) => h.startsWith("/jade"), feature: "product" },
  { test: (h) => h.startsWith("/book"), feature: "spa_bookings" },
  { test: (h) => h.startsWith("/e/"), feature: "ticketed_events" },
  { test: (h) => h.startsWith("/thepamperedsoul/crm") || h.startsWith("/thepamperedsoul/scorecard"), feature: "crm_consent" },
  { test: (h) => h.startsWith("/thepamperedsoul/bookings"), feature: "spa_bookings" },
  {
    test: (h) =>
      h.startsWith("/thepamperedsoul/events") ||
      h.startsWith("/thepamperedsoul/new") ||
      h.startsWith("/thepamperedsoul/guests"),
    feature: "ticketed_events",
  },
  {
    test: (h) => h.startsWith("/thepamperedsoul/calendar"),
    feature: ["spa_bookings", "ticketed_events"],
  },
  {
    test: (h) => h === "/thepamperedsoul" || h.startsWith("/thepamperedsoul"),
    feature: ["spa_bookings", "ticketed_events", "crm_consent"],
  },
];

export function filterNavByFeatures(
  nav: NavItem[],
  features: FeatureKey[],
  snapshot: FeaturesSnapshot | null = null,
): NavItem[] {
  return nav.filter((item) => {
    const path = item.href.split("?")[0];
    if (
      path === "/organize" ||
      path === "/" ||
      path.startsWith("/dashboard") ||
      path.startsWith("/portal") ||
      path.startsWith("/vendor") ||
      path.startsWith("/v/")
    ) {
      return true;
    }
    const pathVenture = ventureFromPathname(path);
    const feats =
      pathVenture && snapshot ? featuresForVenture(snapshot, pathVenture) : features;
    for (const rule of HREF_FEATURE) {
      if (rule.test(path)) return hasFeature(feats, rule.feature);
    }
    return true;
  });
}

export function pamperedLinkFeature(href: string): FeatureKey | FeatureKey[] | null {
  if (href === "/thepamperedsoul") return ["spa_bookings", "ticketed_events", "crm_consent"];
  if (href.startsWith("/thepamperedsoul/crm") || href.startsWith("/thepamperedsoul/scorecard")) return "crm_consent";
  if (href.startsWith("/thepamperedsoul/bookings")) return "spa_bookings";
  if (
    href.startsWith("/thepamperedsoul/events") ||
    href.startsWith("/thepamperedsoul/new") ||
    href.startsWith("/thepamperedsoul/guests")
  ) {
    return "ticketed_events";
  }
  if (href.startsWith("/thepamperedsoul/calendar")) return ["spa_bookings", "ticketed_events"];
  return ["spa_bookings", "ticketed_events", "crm_consent"];
}

export function luminaryLinkFeature(_href: string): FeatureKey {
  return "hotel";
}

export function jadeLinkFeature(href: string): FeatureKey {
  if (href.startsWith("/jade/batches") || href.startsWith("/jade/materials") || href.startsWith("/jade/products") || href.startsWith("/jade/skus")) {
    return "product";
  }
  return "product";
}

export function featuresCookieOptions(snapshot: FeaturesSnapshot) {
  return {
    name: FEATURES_COOKIE,
    value: JSON.stringify(snapshot),
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
