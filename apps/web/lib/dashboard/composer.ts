/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { getTenant } from "@/lib/dashboard/registry";
import { hotelPort } from "@/lib/dashboard/ports/hotel";
import { placeholderPort, productPort } from "@/lib/dashboard/ports/product";
import type { DashboardPayload, VentureDefinition, VenturePortResult } from "@/lib/dashboard/types";
import { businessToday } from "@/lib/dates";

const PLACEHOLDER_STATUS: Record<string, string> = {
  jade_experiences: "Event production · not enabled",
  jade_haven: "Pre-revenue · Development phase",
  stemworks: "Pre-revenue · Validation phase",
};

export async function composeDashboard(input: {
  tenantKey: string;
  venture?: string;
  horizonDays?: number;
  businessDate?: string;
}): Promise<DashboardPayload | { error: string; status: number }> {
  const tenant = getTenant(input.tenantKey);
  if (!tenant) return { error: "Unknown tenant.", status: 404 };

  const ventureFilter = input.venture?.trim();
  if (ventureFilter && !tenant.ventures.some((venture) => venture.key === ventureFilter)) {
    return { error: "Unknown venture.", status: 404 };
  }

  const businessDate = input.businessDate ?? businessToday();
  const horizonDays = input.horizonDays ?? 90;
  const selected = ventureFilter
    ? tenant.ventures.filter((venture) => venture.key === ventureFilter)
    : tenant.ventures;

  const portResults = await Promise.all(
    selected.map(async (definition) => ({
      definition,
      port: await resolvePort(definition, businessDate, horizonDays),
    })),
  );

  const ventures = portResults.map(({ definition, port }) => {
    const nextMilestone = port.milestones[0]
      ? {
          title: port.milestones[0].title,
          dueOn: port.milestones[0].dueOn,
          venture: definition.key,
          colorToken: definition.colorToken,
        }
      : null;
    return {
      key: definition.key,
      name: definition.name,
      colorToken: definition.colorToken,
      expanded: port.hasCurrentActivity,
      statusLabel: port.statusLabel,
      confirmedCents: port.confirmedCents,
      potentialCents: port.potentialCents,
      openCount: port.openCount,
      nextMilestone,
      topItems: port.topItems,
      detailHref: port.detailHref,
    };
  });

  const attention = portResults.flatMap(({ port }) => port.attention);
  const milestones = portResults
    .flatMap(({ port }) => port.milestones)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.title.localeCompare(b.title));

  const confirmedCents = ventures.reduce((sum, card) => sum + card.confirmedCents, 0);
  const potentialCents = ventures.reduce((sum, card) => sum + card.potentialCents, 0);
  const nextMilestone = milestones[0]
    ? {
        title: milestones[0].title,
        dueOn: milestones[0].dueOn,
        venture: milestones[0].venture,
        colorToken: milestones[0].colorToken,
      }
    : null;

  return {
    tenant: { key: tenant.key, name: tenant.name },
    businessDate,
    timezone: tenant.timezone,
    venture: ventureFilter ?? "all",
    header: {
      confirmedCents,
      potentialCents,
      nextMilestone,
      topAlert: attention[0] ?? null,
    },
    ventures,
    attention,
    milestones,
  };
}

async function resolvePort(
  definition: VentureDefinition,
  businessDate: string,
  horizonDays: number,
): Promise<VenturePortResult> {
  if (definition.module === "hotel" && definition.hotelSlice) {
    return hotelPort(definition.hotelSlice, businessDate, horizonDays);
  }
  if (definition.module === "product") {
    return productPort(businessDate);
  }
  return placeholderPort(PLACEHOLDER_STATUS[definition.key] ?? "Not enabled", "/dashboard");
}
