import assert from "node:assert/strict";
import test from "node:test";

import { mapImport, parseCsv } from "./csv";
import { dollarsToCents } from "./money";
import { parseBusinessDate, parseTime } from "./dates";

test("dollars become integer cents without float drift", () => {
  assert.equal(dollarsToCents("189.10"), 18910);
  assert.equal(dollarsToCents("$1,240.00"), 124000);
  assert.equal(dollarsToCents(""), null);
});

test("business dates accept the formats exports actually use", () => {
  assert.equal(parseBusinessDate("2026-05-02"), "2026-05-02");
  assert.equal(parseBusinessDate("5/2/2026"), "2026-05-02");
  assert.equal(parseBusinessDate("May 2, 2026"), "2026-05-02");
  assert.equal(parseBusinessDate("February 31, 2026"), null);
});

test("reservation times accept 12-hour and 24-hour values", () => {
  assert.equal(parseTime("7:30 PM"), "19:30");
  assert.equal(parseTime("19:30"), "19:30");
  assert.equal(parseTime("12:00 am"), "00:00");
});

test("quoted commas survive csv parsing", () => {
  const rows = parseCsv('guest_name,notes\n"Ada, Lovelace","river view"\n');
  assert.equal(rows[1][0], "Ada, Lovelace");
  assert.equal(rows[1][1], "river view");
});

test("an Airbnb-shaped export maps onto a room booking", () => {
  const csv = [
    "Confirmation code,Guest name,Start date,End date,Listing,# of adults,# of children,Earnings,Status",
    "HMABC123,Jordan Hale,05/02/2026,05/05/2026,River King,2,1,$640.50,Accepted",
  ].join("\n");
  const result = mapImport("airbnb", csv);
  assert.equal(result.issues.length, 0);
  assert.equal(result.records[0].channel, "airbnb");
  assert.equal(result.records[0].partySize, 3);
  assert.equal(result.records[0].amountCents, 64050);
  assert.equal(result.records[0].arrivalDate, "2026-05-02");
  assert.equal(result.records[0].departureDate, "2026-05-05");
  assert.equal(result.records[0].status, "confirmed");
  assert.equal(result.records[0].roomType, "River King");
});

test("a stay-shaped source keeps its own channel inside the property book", () => {
  const csv = "confirmation_code,guest_name,arrival_date,departure_date,party_size,amount,status\nVR1,Ada Lovelace,2026-06-01,2026-06-04,2,200.00,confirmed\n";
  const result = mapImport("vrbo", csv, "stay");
  assert.equal(result.issues.length, 0);
  assert.equal(result.records[0].channel, "vrbo");
  assert.equal(result.records[0].kind, "room");
  assert.equal(result.records[0].amountCents, 20000);
});

test("a restaurant row requires a known Luminary outlet", () => {
  const csv = "guest_name,date,time,party_size,outlet\nSam Lee,2026-06-01,7:30 PM,4,Silver King\n";
  const result = mapImport("restaurant", csv);
  assert.equal(result.records[0].outlet, "silver_king");
  assert.equal(result.records[0].reservationTime, "19:30");

  const missing = mapImport("restaurant", "guest_name,date,time,party_size,outlet\nSam Lee,2026-06-01,7:30 PM,4,Unknown Grill\n");
  assert.equal(missing.records.length, 0);
  assert.match(missing.issues[0].message, /Outlet/);
});
