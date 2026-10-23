import assert from "node:assert/strict";
import test from "node:test";

import { aggregateRentals } from "./aggregate";

const sources = [
  { key: "luminary_website", label: "Luminary website", importShape: "stay" as const },
  { key: "airbnb", label: "Airbnb", importShape: "airbnb" as const },
];

test("the property total is the sum of every rental source", () => {
  const result = aggregateRentals({
    businessDate: "2026-10-23",
    sources,
    bookings: [
      stay("luminary_website", "confirmed", "2026-10-25", "2026-10-28", 64050),
      stay("airbnb", "confirmed", "2026-11-02", "2026-11-05", 41200),
      stay("luminary_website", "inquiry", "2026-11-12", "2026-11-14", 30000),
      stay("luminary_website", "cancelled", "2026-10-30", "2026-11-01", 50000),
      stay("airbnb", "confirmed", "2026-12-01", "2026-12-03", null),
      { kind: "restaurant", channel: "restaurant", status: "confirmed", arrivalDate: "2026-10-23", departureDate: null, amountCents: 18640 },
    ],
  });

  assert.deepEqual(result.rentals, { openCount: 4, confirmedCents: 105250, potentialCents: 135250 });
  assert.equal(result.sources[0].openCount, 2);
  assert.equal(result.sources[0].confirmedCents, 64050);
  assert.equal(result.sources[0].potentialCents, 94050);
  assert.equal(result.sources[1].openCount, 2);
  assert.equal(result.sources[1].confirmedCents, 41200);
  assert.equal(result.sources[1].potentialCents, 41200);
});

test("a source with no stays stays on the aggregate at zero", () => {
  const result = aggregateRentals({
    businessDate: "2026-10-23",
    sources: [...sources, { key: "vrbo", label: "Vrbo", importShape: "stay" }],
    bookings: [],
  });

  assert.equal(result.sources.length, 3);
  assert.equal(result.sources[2].key, "vrbo");
  assert.equal(result.sources[2].openCount, 0);
  assert.equal(result.rentals.confirmedCents, 0);
});

function stay(channel: string, status: string, arrivalDate: string, departureDate: string, amountCents: number | null) {
  return { kind: "room", channel, status, arrivalDate, departureDate, amountCents };
}
