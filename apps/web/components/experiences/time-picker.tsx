/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export function TimePicker({ id, name, disabled }: { id: string; name: string; disabled?: boolean }) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("PM");
  const valid = /^(0?[1-9]|1[0-2])$/.test(hour) && /^[0-5]?[0-9]$/.test(minute);

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-1.5">
      <legend className="text-sm font-medium">Start time</legend>
      <input type="hidden" name={name} value={valid ? `${Number(hour)}:${minute.padStart(2, "0")} ${period}` : ""} />
      <div className="grid grid-cols-[1fr_auto_1fr_1.15fr] items-center gap-1.5">
        <TimeSegment id={`${id}-hour`} label="Hour" value={hour} onChange={setHour} min={1} max={12} />
        <span aria-hidden="true" className="text-slate-500">:</span>
        <TimeSegment id={`${id}-minute`} label="Minute" value={minute} onChange={setMinute} min={0} max={59} padded />
        <select
          aria-label="AM or PM"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 min-w-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </fieldset>
  );
}

function TimeSegment({ id, label, value, onChange, min, max, padded = false }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  padded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const options = Array.from({ length: max - min + 1 }, (_, index) => {
    const number = String(min + index);
    return padded ? number.padStart(2, "0") : number;
  });

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function choose(index: number) {
    onChange(options[index]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative min-w-0" onBlur={(event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      setOpen(false);
      if (value && Number(value) >= min && Number(value) <= max) {
        const normalized = String(Number(value));
        onChange(padded ? normalized.padStart(2, "0") : normalized);
      }
    }}>
      <Input
        ref={inputRef}
        id={id}
        aria-label={label}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        aria-autocomplete="none"
        autoComplete="off"
        inputMode="numeric"
        maxLength={2}
        pattern={padded ? "[0-5]?[0-9]" : "(0?[1-9]|1[0-2])"}
        title={padded ? "Enter a minute from 00 to 59." : "Enter an hour from 1 to 12."}
        required
        placeholder={padded ? "MM" : "HH"}
        value={value}
        className="min-w-0 pl-2 pr-7 text-center"
        onChange={(event) => {
          if (/^\d{0,2}$/.test(event.target.value)) {
            onChange(event.target.value);
            setOpen(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const current = Math.max(0, options.findIndex((option) => Number(option) === Number(value)));
            setActive(open ? (active + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : current);
            setOpen(true);
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            choose(active);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "Tab") {
            setOpen(false);
          }
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Choose ${label.toLowerCase()}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        className="absolute inset-y-0 right-0 flex w-7 items-center justify-center rounded-r-md text-slate-500 hover:bg-slate-100"
        onClick={() => {
          setActive(Math.max(0, options.findIndex((option) => Number(option) === Number(value))));
          setOpen(!open);
          inputRef.current?.focus();
        }}
      >
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <ul ref={listRef} id={`${id}-options`} role="listbox" aria-label={`${label} options`}
          className="absolute left-0 top-full z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((option, index) => (
            <li key={option} id={`${id}-option-${index}`} role="option" aria-selected={index === active}
              className={`cursor-pointer rounded px-2 py-2 text-center text-sm ${index === active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
              {option}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
