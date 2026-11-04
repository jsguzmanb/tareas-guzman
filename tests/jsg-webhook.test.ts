import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  isNewerAccessEvent,
  parseJsgMembershipEvent,
  verifyJsgWebhookSignature,
} from "../src/lib/jsg-webhook";

const secret = "test-secret-not-for-production";
const now = new Date("2026-09-18T12:00:00.000Z");
const timestamp = String(Math.floor(now.getTime() / 1000));
const body = JSON.stringify({
  event_id: "evt_membership_1",
  email: "Member@Example.com",
  wp_user_id: 54,
  entitlement: "tasks",
  active: false,
  occurred_at: "2026-09-18T11:59:30+00:00",
  status: "canceled",
});
const signature = `v1=${createHmac("sha256", secret)
  .update(`${timestamp}.${body}`)
  .digest("hex")}`;

test("validates the existing JSG HMAC contract", () => {
  assert.equal(
    verifyJsgWebhookSignature({ rawBody: body, timestamp, signature, secret, now }),
    true,
  );
  assert.equal(
    verifyJsgWebhookSignature({
      rawBody: `${body} `,
      timestamp,
      signature,
      secret,
      now,
    }),
    false,
  );
});

test("rejects webhook timestamps outside the five-minute window", () => {
  const staleNow = new Date(now.getTime() + 301_000);
  assert.equal(
    verifyJsgWebhookSignature({
      rawBody: body,
      timestamp,
      signature,
      secret,
      now: staleNow,
    }),
    false,
  );
});

test("parses the membership payload and derives the stable WordPress subject", () => {
  const event = parseJsgMembershipEvent(body);
  assert.equal(event.subject, "wp:54");
  assert.equal(event.email, "member@example.com");
  assert.equal(event.entitlement, "tasks");
  assert.equal(event.active, false);
});

test("applies only access events newer than the stored membership state", () => {
  const current = new Date("2026-09-18T12:00:00.000Z");
  assert.equal(isNewerAccessEvent(current, new Date("2026-09-18T12:00:01Z")), true);
  assert.equal(isNewerAccessEvent(current, current), false);
  assert.equal(isNewerAccessEvent(current, new Date("2026-09-18T11:59:59Z")), false);
});
