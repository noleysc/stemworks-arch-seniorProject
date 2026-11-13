/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardTodoRecord } from "@/lib/dashboard/todos";
import { RequestError, requestErrorMessage, requestJson } from "@/lib/http";

export function DashboardTodoList({ tenantKey }: { tenantKey: string }) {
  const [todos, setTodos] = useState<DashboardTodoRecord[]>([]);
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const body = await requestJson<{ todos: DashboardTodoRecord[] }>(`/api/v1/todos?tenant=${encodeURIComponent(tenantKey)}`, {}, "We couldn’t load your tasks. Please try again.");
      if (!Array.isArray(body.todos)) throw new RequestError("We couldn’t load your tasks. Please try again.");
      setTodos(body.todos);
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t load your tasks. Please try again."));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKey]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    try {
      await requestJson(`/api/v1/todos?tenant=${encodeURIComponent(tenantKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueOn }),
      }, "We couldn’t add this task. Check its title and date, then try again.");
      setTitle("");
      setDueOn("");
      await load();
    } catch (err) {
      setError(requestErrorMessage(err, "We couldn’t add this task. Check its title and date, then try again."));
    } finally {
      setPending(false);
    }
  }

  async function toggleDone(todo: DashboardTodoRecord) {
    setError(null);
    try {
      await requestJson(`/api/v1/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !todo.done }),
      }, "We couldn’t update this task. Please try again.");
      await load();
    } catch (error) {
      setError(requestErrorMessage(error, "We couldn’t update this task. Please try again."));
    }
  }

  async function remove(todoId: string) {
    setError(null);
    try {
      await requestJson(`/api/v1/todos/${todoId}`, { method: "DELETE" }, "We couldn’t delete this task. Please try again.");
      await load();
    } catch (error) {
      setError(requestErrorMessage(error, "We couldn’t delete this task. Please try again."));
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">To-do</h2>
          <p className="mt-1 text-sm text-stone-600">Owner tasks for this tenant. Separate from attention alerts.</p>
        </div>
      </div>

      <form onSubmit={onCreate} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a to-do"
          className="sm:flex-1"
        />
        <Input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} className="sm:w-44" />
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>

      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}

      {todos.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">No to-dos yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2"
            >
              <label className="flex min-w-0 flex-1 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={todo.done}
                  onChange={() => void toggleDone(todo)}
                />
                <span className={todo.done ? "text-stone-400 line-through" : "text-stone-900"}>
                  {todo.title}
                  {todo.dueOn ? <span className="ml-2 text-stone-500">· due {todo.dueOn}</span> : null}
                </span>
              </label>
              <button type="button" className="text-sm text-stone-500 underline" onClick={() => void remove(todo.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
