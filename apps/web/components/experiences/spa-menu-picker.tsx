/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { formatDuration, formatMenuPrice, spaServicesByCategory, type SpaService } from "@/lib/experiences/spa-menu";
import { cn } from "@/lib/utils";

export function SpaMenuPicker({
  selectedKeys,
  onAdd,
  disabled,
}: {
  selectedKeys: string[];
  onAdd: (service: SpaService) => void;
  disabled?: boolean;
}) {
  const selected = new Set(selectedKeys);

  return (
    <div className="space-y-6">
      {spaServicesByCategory().map((group) => (
        <section key={group.key}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{group.label}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {group.services.map((service) => {
              const added = selected.has(service.key);
              return (
                <li key={service.key}>
                  <button
                    type="button"
                    disabled={disabled || added}
                    onClick={() => onAdd(service)}
                    className={cn(
                      "h-full w-full rounded-2xl border px-4 py-3 text-left transition",
                      added
                        ? "border-slate-900/20 bg-slate-900 text-[#eef2f6]"
                        : "border-slate-900/10 bg-white/80 hover:border-slate-900/30 hover:bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">
                        {service.emoji} {service.title}
                      </p>
                      <span className="shrink-0 text-sm">{formatMenuPrice(service.menuPriceCents)}</span>
                    </div>
                    <p className={cn("mt-1 text-xs", added ? "text-slate-300" : "text-slate-600")}>
                      {formatDuration(service.durationMinutes) ?? "Length on request"}
                    </p>
                    <p className={cn("mt-2 text-sm leading-5", added ? "text-slate-200" : "text-slate-600")}>
                      {service.detail}
                    </p>
                    <p className={cn("mt-3 text-xs font-medium", added ? "text-amber-100" : "text-slate-500")}>
                      {added ? "On this event" : "Add to event"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
