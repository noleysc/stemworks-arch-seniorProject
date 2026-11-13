import Link from "next/link";

export default function UnavailableOwnerInvite() {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-950">
      <h1 className="font-display text-3xl">This invite could not be found</h1>
      <p className="text-sm text-slate-600">Check the link or return to your invite list.</p>
      <Link href="/experiences" className="text-sm underline">Back to invites</Link>
    </section>
  );
}
