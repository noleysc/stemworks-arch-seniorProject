/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";

import { VentureOrganizer } from "@/components/ventures/venture-organizer";
import { getDemoSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default function OrganizePage() {
  const session = getDemoSession();
  if (!session.signedIn) redirect("/login");
  if (!session.appOwner && session.role !== "owner") {
    redirect(session.definition.homeHref);
  }

  return <VentureOrganizer canCreate={session.appOwner || session.role === "owner"} />;
}
