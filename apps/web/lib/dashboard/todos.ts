/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { z } from "zod";

import { prisma } from "@/lib/db";
import { getTenant } from "@/lib/dashboard/registry";
import { ensureTenant, TENANTS } from "@/lib/tenancy";

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Write a to-do.").max(200),
  dueOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export type DashboardTodoRecord = {
  id: string;
  title: string;
  done: boolean;
  dueOn: string | null;
  sortOrder: number;
};

function tenantKeyOrThrow(tenantKey: string) {
  if (!getTenant(tenantKey)) throw new Error("Unknown tenant.");
  const match = (Object.keys(TENANTS) as (keyof typeof TENANTS)[]).find(
    (key) => TENANTS[key].key === tenantKey,
  );
  if (!match) throw new Error("Unknown tenant.");
  return match;
}

export async function listTodos(tenantKey: string) {
  const tenant = await ensureTenant(tenantKeyOrThrow(tenantKey));
  const rows = await prisma.dashboardTodo.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ done: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    done: row.done,
    dueOn: row.dueOn,
    sortOrder: row.sortOrder,
  }));
}

export async function createTodo(tenantKey: string, raw: z.input<typeof createTodoSchema>) {
  const input = createTodoSchema.parse(raw);
  const tenant = await ensureTenant(tenantKeyOrThrow(tenantKey));
  const count = await prisma.dashboardTodo.count({ where: { tenantId: tenant.id } });
  return prisma.dashboardTodo.create({
    data: {
      tenantId: tenant.id,
      title: input.title,
      dueOn: input.dueOn?.trim() ? input.dueOn : null,
      sortOrder: count,
    },
  });
}

export async function setTodoDone(todoId: string, done: boolean) {
  return prisma.dashboardTodo.update({
    where: { id: todoId },
    data: { done },
  });
}

export async function deleteTodo(todoId: string) {
  return prisma.dashboardTodo.delete({ where: { id: todoId } });
}
