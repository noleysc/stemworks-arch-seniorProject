/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  appointmentWindowMinutes,
  parseTimeLabelToMinutes,
  windowsOverlap,
} from "@/lib/experiences/appointment-times";

test("parses twelve-hour appointment labels", () => {
  assert.equal(parseTimeLabelToMinutes("9:00 AM"), 9 * 60);
  assert.equal(parseTimeLabelToMinutes("12:00 PM"), 12 * 60);
  assert.equal(parseTimeLabelToMinutes("2:00 PM"), 14 * 60);
  assert.equal(parseTimeLabelToMinutes("12:00 AM"), 0);
});

test("detects overlapping appointment windows", () => {
  const first = appointmentWindowMinutes("2:00 PM", 50);
  const second = appointmentWindowMinutes("2:00 PM", 50);
  const later = appointmentWindowMinutes("3:00 PM", 50);
  assert.ok(first && second && later);
  assert.equal(windowsOverlap(first, second), true);
  assert.equal(windowsOverlap(first, later), false);
});
