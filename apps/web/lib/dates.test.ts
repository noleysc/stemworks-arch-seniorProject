/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { businessToday, businessYearMonth } from "@/lib/dates";

test("businessYearMonth matches America/New_York businessToday", () => {
  const fixed = new Date("2026-03-01T03:30:00.000Z"); // still Feb 28 in New York
  assert.equal(businessToday(fixed), "2026-02-28");
  assert.deepEqual(businessYearMonth(fixed), { year: 2026, month: 1 });

  const afterMidnightEt = new Date("2026-03-01T05:00:00.000Z"); // Mar 1 00:00 ET
  assert.equal(businessToday(afterMidnightEt), "2026-03-01");
  assert.deepEqual(businessYearMonth(afterMidnightEt), { year: 2026, month: 2 });
});
