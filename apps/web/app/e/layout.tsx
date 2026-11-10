/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

/** Guest invite chrome. No planner nav, no CRM links — shareable Partiful-style page only. */
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#070b12] text-white">{children}</div>;
}
