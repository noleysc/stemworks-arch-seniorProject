/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/auth/session";
import { validateBlueprintInput } from "@/lib/ventures/blueprint";
import { deleteBlueprint, getBlueprint, updateBlueprint } from "@/lib/ventures/blueprint-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Sign in as an owner to organize ventures." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Only owners can create or edit venture blueprints." }, { status: 403 });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = getDemoSession();
  if (!session.signedIn) return unauthorized();
  if (!session.appOwner && session.role !== "owner") return forbidden();
  const blueprint = await getBlueprint(params.id);
  if (!blueprint) return NextResponse.json({ error: "Venture blueprint not found." }, { status: 404 });
  return NextResponse.json({ blueprint });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const blueprint = await updateBlueprint(params.id, parsed.value);
  if (!blueprint) return NextResponse.json({ error: "Venture blueprint not found." }, { status: 404 });
  return NextResponse.json({ blueprint });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = getDemoSession();
  if (!session.signedIn) return unauthorized();
  if (!session.appOwner) {
    return NextResponse.json({ error: "Only Stemworks app ownership can delete a venture blueprint." }, { status: 403 });
  }
  const ok = await deleteBlueprint(params.id);
  if (!ok) return NextResponse.json({ error: "Venture blueprint not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
