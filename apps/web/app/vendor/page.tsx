/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { redirect } from "next/navigation";

import { VendorHome } from "@/components/dashboard/vendor-home";
import { getDemoSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default function VendorPage() {
  const { role, definition } = getDemoSession();
  if (role !== "vendor" && role !== "owner") {
    redirect(definition.homeHref);
  }
  return <VendorHome />;
}
