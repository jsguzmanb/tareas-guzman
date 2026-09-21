import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export type JsgMembershipEvent = {
  eventId: string;
  subject: string;
  email: string;
  entitlement: "tasks";
  active: boolean;
  status: string;
  occurredAt: Date;
};

export function verifyJsgWebhookSignature({
  rawBody,
  timestamp,
  signature,
  secret,
  now = new Date(),
}: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
  now?: Date;
}) {
  if (!/^\d{10}$/.test(timestamp) || !/^v1=[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const signedAt = Number(timestamp);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (Math.abs(nowSeconds - signedAt) > MAX_WEBHOOK_AGE_SECONDS) return false;

  const expected = `v1=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function parseJsgMembershipEvent(rawBody: string): JsgMembershipEvent {
  const body: unknown = JSON.parse(rawBody);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid webhook body");
  }

  const value = body as Record<string, unknown>;
  const eventId = value.event_id;
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const wpUserId = value.wp_user_id;
  const entitlement = value.entitlement;
  const active = value.active;
  const status = value.status;
  const occurredAtValue = value.occurred_at;
  const occurredAt =
    typeof occurredAtValue === "string" ? new Date(occurredAtValue) : null;

  if (
    typeof eventId !== "string" ||
    !eventId ||
    eventId.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Number.isInteger(wpUserId) ||
    Number(wpUserId) <= 0 ||
    entitlement !== "tasks" ||
    typeof active !== "boolean" ||
    typeof status !== "string" ||
    !status ||
    !occurredAt ||
    Number.isNaN(occurredAt.getTime())
  ) {
    throw new Error("Invalid webhook payload");
  }

  return {
    eventId,
    subject: `wp:${wpUserId}`,
    email,
    entitlement,
    active,
    status,
    occurredAt,
  };
}

export function isNewerAccessEvent(
  currentUpdatedAt: Date | null,
  incomingOccurredAt: Date,
) {
  return !currentUpdatedAt || incomingOccurredAt > currentUpdatedAt;
}
