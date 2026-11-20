/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  emptyBlueprint,
  seedBlueprints,
  type BlueprintStore,
  type VentureBlueprint,
} from "@/lib/ventures/blueprint";
import { snapshotFromBlueprints, type FeaturesSnapshot } from "@/lib/ventures/live-features";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "venture-blueprints.json");

function migrateBlueprints(blueprints: VentureBlueprint[]): VentureBlueprint[] {
  return blueprints.map((item) => {
    if (item.linkedVentureKey) return item;
    if (item.id === "bp_luminary") return { ...item, linkedVentureKey: "luminary" };
    if (item.id === "bp_jade") return { ...item, linkedVentureKey: "diaz_ventures" };
    if (item.id === "bp_pampered") return { ...item, linkedVentureKey: "pampered_soul" };
    return { ...item, linkedVentureKey: item.linkedVentureKey ?? null };
  });
}

async function ensureStore(): Promise<BlueprintStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as BlueprintStore;
    if (!parsed?.blueprints || !Array.isArray(parsed.blueprints) || parsed.blueprints.length === 0) {
      throw new Error("empty");
    }
    return { blueprints: migrateBlueprints(parsed.blueprints) };
  } catch {
    const store: BlueprintStore = { blueprints: seedBlueprints() };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  }
}

export async function featuresSnapshot(): Promise<FeaturesSnapshot> {
  const store = await ensureStore();
  return snapshotFromBlueprints(store.blueprints);
}

async function writeStore(store: BlueprintStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function listBlueprints(): Promise<VentureBlueprint[]> {
  const store = await ensureStore();
  return store.blueprints;
}

export async function getBlueprint(id: string): Promise<VentureBlueprint | null> {
  const store = await ensureStore();
  return store.blueprints.find((item) => item.id === id) ?? null;
}

export async function createBlueprint(input: Partial<VentureBlueprint>): Promise<VentureBlueprint> {
  const store = await ensureStore();
  const blueprint = emptyBlueprint({
    ...input,
    id: `bp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  });
  store.blueprints.push(blueprint);
  await writeStore(store);
  return blueprint;
}

export async function updateBlueprint(
  id: string,
  patch: Partial<VentureBlueprint>,
): Promise<VentureBlueprint | null> {
  const store = await ensureStore();
  const index = store.blueprints.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = store.blueprints[index];
  const next: VentureBlueprint = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  store.blueprints[index] = next;
  await writeStore(store);
  return next;
}

export async function deleteBlueprint(id: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.blueprints.length;
  store.blueprints = store.blueprints.filter((item) => item.id !== id);
  if (store.blueprints.length === before) return false;
  if (store.blueprints.length === 0) store.blueprints = seedBlueprints();
  await writeStore(store);
  return true;
}
