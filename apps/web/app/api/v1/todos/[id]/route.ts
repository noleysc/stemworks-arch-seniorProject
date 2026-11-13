/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { deleteTodo, setTodoDone } from "@/lib/dashboard/todos";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (typeof body.done !== "boolean") {
      return NextResponse.json({ error: "done must be a boolean." }, { status: 400 });
    }
    const todo = await setTodoDone(context.params.id, body.done);
    return NextResponse.json({ todo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update to-do.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    await deleteTodo(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete to-do.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
