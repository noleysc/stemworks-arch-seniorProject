/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import { createTodo, deleteTodo, listTodos, setTodoDone } from "@/lib/dashboard/todos";
import { prisma } from "@/lib/db";

test("dashboard to-dos are scoped to a tenant", async () => {
  const created = await createTodo("pampered_soul", {
    title: "Confirm Saturday therapists",
    dueOn: "2026-12-20",
  });
  assert.equal(created.title, "Confirm Saturday therapists");
  assert.equal(created.done, false);

  const listed = await listTodos("pampered_soul");
  assert.ok(listed.some((row) => row.id === created.id));

  const done = await setTodoDone(created.id, true);
  assert.equal(done.done, true);

  await deleteTodo(created.id);
  assert.equal((await listTodos("pampered_soul")).some((row) => row.id === created.id), false);

  await prisma.dashboardTodo.deleteMany({ where: { title: "Confirm Saturday therapists" } });
});
