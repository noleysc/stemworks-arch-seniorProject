/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/**
 * Owner venture blueprints — draft shape for creating/organizing ventures.
 * Metrics are ordered for the command board; features map to Stemworks modules.
 */

export const VENTURE_TYPES = [
  "boutique_hotel",
  "product_brand",
  "event_production",
  "wellness_hospitality",
  "software",
] as const;

export type VentureType = (typeof VENTURE_TYPES)[number];

export const METRIC_CATALOG = [
  { key: "confirmed", label: "Confirmed", description: "Bankable revenue already committed" },
  { key: "potential", label: "Potential", description: "Confirmed plus deals still in motion" },
  { key: "gap", label: "Execution gap", description: "Potential minus Confirmed" },
  { key: "open_count", label: "Open work", description: "Active bookings, orders, or registrations" },
  { key: "attention", label: "Attention", description: "Highest-priority alert for this venture" },
  { key: "next_milestone", label: "Next milestone", description: "Soonest due date on the board" },
  { key: "retention", label: "Customer retention", description: "Repeat guests or buyers signal" },
  { key: "inventory", label: "Inventory health", description: "Low stock and reorder pressure" },
  { key: "bookings_today", label: "Bookings today", description: "Appointments or stays for the business date" },
  { key: "events_open", label: "Open events", description: "Published ticketed nights still selling" },
] as const;

export type MetricKey = (typeof METRIC_CATALOG)[number]["key"];

export const FEATURE_CATALOG = [
  { key: "hotel", label: "Hotel ops", description: "Rooms, dining, gatherings collection" },
  { key: "product", label: "Product ops", description: "Materials, batches, SKUs, orders" },
  { key: "spa_bookings", label: "Spa bookings", description: "Individual service appointments" },
  { key: "ticketed_events", label: "Ticketed events", description: "Owner planner + guest checkout" },
  { key: "crm_consent", label: "CRM + consent", description: "Guest profiles and vendor opt-ins" },
  { key: "atelier", label: "Candle Atelier", description: "Brand-hosted sessions (later module)" },
  { key: "event_production", label: "Event production", description: "Series P&L and talent (later)" },
  { key: "hospitality", label: "Haven hospitality", description: "Pre-open wellness property (later)" },
  { key: "connect", label: "Connect", description: "Integration branches and sync status" },
  { key: "intelligence", label: "Intelligence", description: "Predicted figures with confidence (later)" },
] as const;

export type FeatureKey = (typeof FEATURE_CATALOG)[number]["key"];

export type VentureBlueprint = {
  id: string;
  name: string;
  shortName: string;
  type: VentureType;
  statusLabel: string;
  colorToken: string;
  /** When set, this blueprint drives an existing Stemworks desk */
  linkedVentureKey?: "luminary" | "diaz_ventures" | "pampered_soul" | null;
  /** Ordered metrics shown on this venture’s command header / cards */
  metricOrder: MetricKey[];
  /** Enabled product features / modules */
  features: FeatureKey[];
  createdAt: string;
  updatedAt: string;
};

export type BlueprintStore = {
  blueprints: VentureBlueprint[];
};

export function isVentureType(value: unknown): value is VentureType {
  return typeof value === "string" && (VENTURE_TYPES as readonly string[]).includes(value);
}

export function isMetricKey(value: unknown): value is MetricKey {
  return typeof value === "string" && METRIC_CATALOG.some((item) => item.key === value);
}

export function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && FEATURE_CATALOG.some((item) => item.key === value);
}

export function defaultMetricOrder(): MetricKey[] {
  return ["confirmed", "potential", "gap", "attention", "next_milestone"];
}

export function emptyBlueprint(partial?: Partial<VentureBlueprint>): VentureBlueprint {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? `bp_${Date.now().toString(36)}`,
    name: partial?.name ?? "New venture",
    shortName: partial?.shortName ?? "Venture",
    type: partial?.type ?? "product_brand",
    statusLabel: partial?.statusLabel ?? "Draft · organizing",
    colorToken: partial?.colorToken ?? "stemworks",
    linkedVentureKey: partial?.linkedVentureKey ?? null,
    metricOrder: partial?.metricOrder ?? defaultMetricOrder(),
    features: partial?.features ?? ["product"],
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}

export function seedBlueprints(): VentureBlueprint[] {
  const now = new Date().toISOString();
  return [
    emptyBlueprint({
      id: "bp_luminary",
      name: "Luminary Hotel & Co.",
      shortName: "Luminary",
      type: "boutique_hotel",
      statusLabel: "243 keys · operational",
      colorToken: "rooms",
      linkedVentureKey: "luminary",
      metricOrder: ["confirmed", "potential", "gap", "open_count", "attention", "next_milestone"],
      features: ["hotel", "connect"],
      createdAt: now,
      updatedAt: now,
    }),
    emptyBlueprint({
      id: "bp_jade",
      name: "Jade Flowers",
      shortName: "Jade",
      type: "product_brand",
      statusLabel: "Product floor · active",
      colorToken: "jade",
      linkedVentureKey: "diaz_ventures",
      metricOrder: ["confirmed", "potential", "inventory", "open_count", "attention"],
      features: ["product", "atelier", "connect"],
      createdAt: now,
      updatedAt: now,
    }),
    emptyBlueprint({
      id: "bp_pampered",
      name: "The Pampered Soul",
      shortName: "Pampered Soul",
      type: "wellness_hospitality",
      statusLabel: "Spa desk · live",
      colorToken: "experiences",
      linkedVentureKey: "pampered_soul",
      metricOrder: ["confirmed", "potential", "bookings_today", "events_open", "retention", "attention"],
      features: ["spa_bookings", "ticketed_events", "crm_consent"],
      createdAt: now,
      updatedAt: now,
    }),
  ];
}

export function normalizeMetricOrder(order: unknown): MetricKey[] {
  if (!Array.isArray(order)) return defaultMetricOrder();
  const seen = new Set<MetricKey>();
  const next: MetricKey[] = [];
  for (const item of order) {
    if (!isMetricKey(item) || seen.has(item)) continue;
    seen.add(item);
    next.push(item);
  }
  return next.length > 0 ? next : defaultMetricOrder();
}

export function normalizeFeatures(features: unknown): FeatureKey[] {
  if (!Array.isArray(features)) return [];
  const seen = new Set<FeatureKey>();
  const next: FeatureKey[] = [];
  for (const item of features) {
    if (!isFeatureKey(item) || seen.has(item)) continue;
    seen.add(item);
    next.push(item);
  }
  return next;
}

export function validateBlueprintInput(body: unknown): { ok: true; value: Partial<VentureBlueprint> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Send a JSON blueprint body." };
  const raw = body as Record<string, unknown>;
  const value: Partial<VentureBlueprint> = {};

  if (raw.name !== undefined) {
    if (typeof raw.name !== "string" || raw.name.trim().length < 2) {
      return { ok: false, error: "Name needs at least two characters." };
    }
    value.name = raw.name.trim();
  }
  if (raw.shortName !== undefined) {
    if (typeof raw.shortName !== "string" || raw.shortName.trim().length < 1) {
      return { ok: false, error: "Short name is required." };
    }
    value.shortName = raw.shortName.trim();
  }
  if (raw.type !== undefined) {
    if (!isVentureType(raw.type)) return { ok: false, error: "Choose a valid venture type." };
    value.type = raw.type;
  }
  if (raw.statusLabel !== undefined) {
    if (typeof raw.statusLabel !== "string") return { ok: false, error: "Status label must be text." };
    value.statusLabel = raw.statusLabel.trim() || "Draft · organizing";
  }
  if (raw.colorToken !== undefined) {
    if (typeof raw.colorToken !== "string") return { ok: false, error: "Color token must be text." };
    value.colorToken = raw.colorToken.trim() || "stemworks";
  }
  if (raw.metricOrder !== undefined) value.metricOrder = normalizeMetricOrder(raw.metricOrder);
  if (raw.features !== undefined) value.features = normalizeFeatures(raw.features);

  return { ok: true, value };
}

export function reorderMetrics(order: MetricKey[], fromIndex: number, toIndex: number): MetricKey[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length) return order;
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function toggleFeature(features: FeatureKey[], key: FeatureKey, enabled: boolean): FeatureKey[] {
  if (enabled) return features.includes(key) ? features : [...features, key];
  return features.filter((item) => item !== key);
}

export function addMetric(order: MetricKey[], key: MetricKey): MetricKey[] {
  if (order.includes(key)) return order;
  return [...order, key];
}

export function removeMetric(order: MetricKey[], key: MetricKey): MetricKey[] {
  const next = order.filter((item) => item !== key);
  return next.length > 0 ? next : defaultMetricOrder();
}
