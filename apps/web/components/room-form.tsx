/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROOM_CHANNELS, STATUSES, statusLabel } from "@/lib/catalog";

export function RoomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [channel, setChannel] = useState("luminary_website");
  const [status, setStatus] = useState("confirmed");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "room",
        channel,
        status,
        guestName: form.get("guestName"),
        partySize: form.get("partySize"),
        arrivalDate: form.get("arrivalDate"),
        departureDate: form.get("departureDate"),
        roomType: form.get("roomType"),
        confirmationCode: form.get("confirmationCode"),
        amount: form.get("amount"),
        notes: form.get("notes"),
      }),
    });
    setPending(false);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "The booking did not save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add room booking</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Room booking</DialogTitle>
          <DialogDescription>
            A stay that came through the Luminary website or Airbnb. Type what the hotel already has.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Channel">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_CHANNELS.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Guest">
            <Input name="guestName" required autoComplete="name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Arrival">
              <Input name="arrivalDate" type="date" required />
            </Field>
            <Field label="Departure">
              <Input name="departureDate" type="date" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Guests">
              <Input name="partySize" type="number" min={1} max={40} defaultValue={2} required />
            </Field>
            <Field label="Amount (USD)">
              <Input name="amount" inputMode="decimal" placeholder="0.00" />
            </Field>
          </div>
          <Field label="Room or listing">
            <Input name="roomType" placeholder="King river, or the Airbnb listing name" />
          </Field>
          <Field label="Confirmation code">
            <Input name="confirmationCode" className="font-mono" />
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue>{statusLabel(status, "room")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {statusLabel(item.key, "room")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={3} />
          </Field>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
