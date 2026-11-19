/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { LoginGate } from "@/components/shell/login-gate";

export const dynamic = "force-dynamic";

/** Sign-in gate. Open /login?logout=1 to clear a stuck demo session. */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f5f0e8,_#eef2f6_45%,_#e7ebe8)]">
      <LoginGate />
    </div>
  );
}
