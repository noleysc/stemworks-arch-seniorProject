/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

export const MATERIAL_CATEGORIES = [
  { key: "wax", label: "Wax" },
  { key: "fragrance", label: "Fragrance" },
  { key: "wick", label: "Wick" },
  { key: "vessel", label: "Vessel" },
  { key: "packaging", label: "Packaging" },
  { key: "other", label: "Other" },
] as const;

export const MATERIAL_UNITS = [
  { key: "oz", label: "oz" },
  { key: "lb", label: "lb" },
  { key: "g", label: "g" },
  { key: "kg", label: "kg" },
  { key: "each", label: "each" },
  { key: "yard", label: "yard" },
] as const;

export const ORDER_CHANNELS = [
  { key: "ecommerce", label: "Ecommerce" },
  { key: "wholesale", label: "Wholesale" },
  { key: "event", label: "Event" },
  { key: "consignment", label: "Consignment" },
  { key: "direct", label: "Direct" },
] as const;

export const ORDER_STATUSES = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export const CUSTOMER_KINDS = [
  { key: "retail", label: "Retail" },
  { key: "wholesale", label: "Wholesale" },
  { key: "event_attendee", label: "Event attendee" },
  { key: "corporate_client", label: "Corporate client" },
] as const;

export type OrderChannel = (typeof ORDER_CHANNELS)[number]["key"];
export type OrderStatus = (typeof ORDER_STATUSES)[number]["key"];

export function channelLabel(key: string): string {
  return ORDER_CHANNELS.find((item) => item.key === key)?.label ?? key;
}

export function statusLabel(key: string): string {
  return ORDER_STATUSES.find((item) => item.key === key)?.label ?? key;
}

export function categoryLabel(key: string): string {
  return MATERIAL_CATEGORIES.find((item) => item.key === key)?.label ?? key;
}
