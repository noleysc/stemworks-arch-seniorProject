import assert from "node:assert/strict";
import test from "node:test";

import { RequestError, requestErrorMessage, requestJson } from "./http";

test("HTTP errors show only explicitly public messages, not raw JSON/HTML diagnostics", async () => {
  const original = globalThis.fetch;
  try {
    for (const [body, status] of [
      [JSON.stringify({ error: "Invalid prisma invocation P2002 SELECT secrets" }), 500],
      ["<html>Stripe API key sk_secret failed</html>", 500],
      ["bad JSON", 400], ["null", 200], ["[]", 200], ["<html>Unexpected page</html>", 200],
    ] as const) {
      let requests = 0;
      globalThis.fetch = async () => { requests += 1; return new Response(body, { status }); };
      await assert.rejects(() => requestJson("/checkout", { method: "POST" }, "We couldn’t confirm your tickets."), { message: "We couldn’t confirm your tickets." });
      assert.equal(requests, 1, "A failed payment request must not be resubmitted automatically.");
    }
    globalThis.fetch = async () => Response.json({ error: "Enter a valid card number.", publicError: true }, { status: 400 });
    await assert.rejects(() => requestJson("/checkout", {}, "Fallback"), error => error instanceof RequestError && error.message === "Enter a valid card number." && error.status === 400);
    globalThis.fetch = async () => Response.json({ ok: true });
    assert.deepEqual(await requestJson("/test", {}, "Fallback"), { ok: true });
  } finally {
    globalThis.fetch = original;
  }
});

test("network failures give cautious checkout instructions and never expose browser exceptions", () => {
  assert.equal(requestErrorMessage(new Error("SQL SELECT secrets"), "Please try again."), "Please try again.");
  assert.equal(requestErrorMessage(new TypeError("Failed to fetch"), "Fallback"), "We couldn’t connect. Check your connection and try again.");
  assert.match(requestErrorMessage(new TypeError("Failed to fetch"), "Fallback", true), /Check your payment status/);
  assert.equal(requestErrorMessage(new RequestError("Choose fewer tickets."), "Fallback"), "Choose fewer tickets.");
});
