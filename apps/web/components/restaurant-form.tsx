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
import { OUTLETS, STATUSES, statusLabel } from "@/lib/catalog";

export function RestaurantForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [outlet, setOutlet] = useState<string>(OUTLETS[0].key);
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
        kind: "restaurant",
        outlet,
        status,
        guestName: form.get("guestName"),
        partySize: form.get("partySize"),
        arrivalDate: form.get("arrivalDate"),
        reservationTime: form.get("reservationTime"),
        confirmationCode: form.get("confirmationCode"),
        amount: form.get("amount"),
        notes: form.get("notes"),
      }),
    });
    setPending(false);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "The reservation did not save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add table</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Restaurant reservation</DialogTitle>
          <DialogDescription>
            A table at one Luminary outlet. Silver King takes reservations; the other rooms can be logged the same way.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label>Outlet</Label>
            <Select value={outlet} onValueChange={setOutlet}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTLETS.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Guest</Label>
            <Input name="guestName" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input name="arrivalDate" type="date" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Time</Label>
              <Input name="reservationTime" type="time" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Party</Label>
              <Input name="partySize" type="number" min={1} max={40} defaultValue={2} required />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount (USD)</Label>
              <Input name="amount" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Confirmation code</Label>
            <Input name="confirmationCode" className="font-mono" />
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue>{statusLabel(status, "restaurant")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {statusLabel(item.key, "restaurant")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea name="notes" rows={3} />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save reservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
