/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { NextResponse } from "next/server";

import { createTodo, listTodos } from "@/lib/dashboard/todos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant");
    if (!tenant) return NextResponse.json({ error: "tenant is required." }, { status: 400 });
    const todos = await listTodos(tenant);
    return NextResponse.json({ todos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load to-dos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant");
    if (!tenant) return NextResponse.json({ error: "tenant is required." }, { status: 400 });
    const body = await request.json();
    const todo = await createTodo(tenant, body);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create to-do.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
