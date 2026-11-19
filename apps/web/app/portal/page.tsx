/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";

import { CustomerHome } from "@/components/dashboard/customer-home";
import { getDemoSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default function PortalPage() {
  const { role, definition } = getDemoSession();
  if (role !== "customer" && role !== "owner") {
    redirect(definition.homeHref);
  }
  return <CustomerHome />;
}
