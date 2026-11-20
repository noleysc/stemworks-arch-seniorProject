/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/auth/session";
import { validateBlueprintInput } from "@/lib/ventures/blueprint";
import { attachFeaturesCookie } from "@/lib/ventures/attach-features-cookie";
import { createBlueprint, listBlueprints } from "@/lib/ventures/blueprint-store";
import { deskHrefForBlueprint } from "@/lib/ventures/live-features";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Sign in as an owner to organize ventures." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Only owners can create or edit venture blueprints." }, { status: 403 });
}

export async function GET() {
  const session = getDemoSession();
  if (!session.signedIn) return unauthorized();
  if (!session.appOwner && session.role !== "owner") return forbidden();
  const blueprints = await listBlueprints();
  const response = NextResponse.json({
    blueprints: blueprints.map((item) => ({
      ...item,
      deskHref: deskHrefForBlueprint(item),
    })),
  });
  return attachFeaturesCookie(response);
}

export async function POST(request: Request) {
  const session = getDemoSession();
  if (!session.signedIn) return unauthorized();
  if (!session.appOwner && session.role !== "owner") return forbidden();

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const parsed = validateBlueprintInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const blueprint = await createBlueprint(parsed.value);
  const response = NextResponse.json(
    { blueprint: { ...blueprint, deskHref: deskHrefForBlueprint(blueprint) } },
    { status: 201 },
  );
  return attachFeaturesCookie(response);
}
