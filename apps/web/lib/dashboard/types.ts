/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

export type PipelineItem = {
  label: string;
  stage: string;
  valueCents: number;
  kind: string;
};

export type MilestoneItem = {
  id: string;
  venture: string;
  title: string;
  dueOn: string;
  kind: "event_date" | "pipeline_deadline" | "inventory_reorder";
  colorToken: string;
};

export type AttentionItem = {
  type: "inventory_low" | "event_milestone_due" | "pipeline_stalled";
  body: string;
  venture: string;
};

export type VentureCard = {
  key: string;
  name: string;
  colorToken: string;
  expanded: boolean;
  statusLabel: string;
  confirmedCents: number;
  potentialCents: number;
  openCount: number;
  nextMilestone: { title: string; dueOn: string; venture: string; colorToken: string } | null;
  topItems: PipelineItem[];
  detailHref: string;
};

export type DashboardPayload = {
  tenant: { key: string; name: string };
  businessDate: string;
  timezone: string;
  venture: string;
  header: {
    confirmedCents: number;
    potentialCents: number;
    nextMilestone: { title: string; dueOn: string; venture: string; colorToken: string } | null;
    topAlert: AttentionItem | null;
  };
  ventures: VentureCard[];
  attention: AttentionItem[];
  milestones: MilestoneItem[];
};

export type VenturePortResult = {
  confirmedCents: number;
  potentialCents: number;
  openCount: number;
  hasCurrentActivity: boolean;
  statusLabel: string;
  topItems: PipelineItem[];
  attention: AttentionItem[];
  milestones: MilestoneItem[];
  detailHref: string;
};

export type VentureDefinition = {
  key: string;
  name: string;
  colorToken: string;
  module: "hotel" | "product" | "placeholder";
  hotelSlice?: "rooms" | "dining" | "gatherings";
};
