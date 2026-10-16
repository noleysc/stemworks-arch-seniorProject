/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const streams = [
  {
    key: "luminary_website",
    label: "Luminary website",
    body: "Export the reservation report from the hotel’s Marriott or Luminary booking tools. Columns the desk recognizes: confirmation code, guest name, arrival, departure, room type, party size, amount, status, notes.",
  },
  {
    key: "airbnb",
    label: "Airbnb",
    body: "From the Airbnb host account, export reservations. A file with Confirmation code, Guest name, Start date, End date, Listing, # of adults, # of children, Earnings, and Status drops in as-is.",
  },
  {
    key: "restaurant",
    label: "Restaurant",
    body: "A list from the outlet’s reservation book, including an OpenTable export when the columns match. Outlet can be Silver King, Ella Mae's, Chips, Oxbow, Beacon, Dean Street, Pool Bar, or in-room dining.",
  },
] as const;

type Issue = { row: number; message: string };
type Result = { created: number; updated: number; issues: Issue[] };

export function ImportPanel() {
  return (
    <Tabs defaultValue="luminary_website">
      <TabsList className="h-auto flex-wrap">
        {streams.map((stream) => (
          <TabsTrigger key={stream.key} value={stream.key}>
            {stream.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {streams.map((stream) => (
        <TabsContent key={stream.key} value={stream.key} className="mt-4">
          <StreamImport stream={stream.key} body={stream.body} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function StreamImport({ stream, body }: { stream: string; body: string }) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setResult(null);
    setError(null);
    if (!file) {
      setFileName(null);
      setCsv("");
      return;
    }
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!csv.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/bookings/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stream, csv }),
    });
    setPending(false);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error ?? "The file did not import.");
      return;
    }
    setResult(payload as Result);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="max-w-2xl text-sm leading-6 text-stone-600">{body}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer items-center rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm">
          Choose CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
        </label>
        <span className="text-sm text-stone-500">{fileName ?? "No file chosen"}</span>
        <a className="text-sm text-stone-950 underline underline-offset-4" href={`/api/bookings/template?stream=${stream}`}>
          Download a blank template
        </a>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
          <p>
            {result.created} added, {result.updated} updated
            {result.issues.length ? `, ${result.issues.length} row${result.issues.length === 1 ? "" : "s"} skipped` : ""}.
          </p>
          {result.issues.length ? (
            <ul className="mt-2 space-y-1">
              {result.issues.slice(0, 12).map((issue) => (
                <li key={`${issue.row}-${issue.message}`}>
                  Row {issue.row}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-stone-500">Importing the same confirmation code again updates that booking. It does not create a second stay.</p>
        </div>
      ) : null}
      <Button className="mt-4" type="submit" disabled={pending}>
        {pending ? "Importing" : "Import into the desk"}
      </Button>
    </form>
  );
}
