import assert from "node:assert/strict";
import test from "node:test";
import { exportSPKI, generateKeyPair, SignJWT } from "jose";
import { verifyJsgAccessToken } from "../src/lib/jsg-access-token";

async function fixture(overrides: {
  kid?: string;
  audience?: string;
  lifetime?: number;
  access?: string;
  entitlements?: string[];
} = {}) {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicKeyPem = await exportSPKI(publicKey);
  const now = Math.floor(Date.now() / 1000);
  const kid = overrides.kid ?? "test-2026-09";
  const token = await new SignJWT({
    email: "Member@Example.com",
    entitlements: overrides.entitlements ?? ["tasks"],
    access: overrides.access ?? "active",
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer("https://juansguzman.com")
    .setAudience(overrides.audience ?? "tareas-guzman")
    .setSubject("wp:54")
    .setJti("one-time-token")
    .setIssuedAt(now)
    .setExpirationTime(now + (overrides.lifetime ?? 60))
    .sign(privateKey);

  return {
    token,
    keys: JSON.stringify({ [kid]: publicKeyPem }),
  };
}

test("accepts a valid RS256 member token and normalizes its email", async () => {
  const { token, keys } = await fixture();
  const claims = await verifyJsgAccessToken(token, keys);

  assert.equal(claims.subject, "wp:54");
  assert.equal(claims.email, "member@example.com");
  assert.equal(claims.jti, "one-time-token");
});

test("rejects the wrong audience, inactive access, and missing entitlement", async () => {
  const wrongAudience = await fixture({ audience: "another-app" });
  await assert.rejects(() =>
    verifyJsgAccessToken(wrongAudience.token, wrongAudience.keys),
  );

  const inactive = await fixture({ access: "revoked" });
  await assert.rejects(() => verifyJsgAccessToken(inactive.token, inactive.keys));

  const missingEntitlement = await fixture({ entitlements: ["courses"] });
  await assert.rejects(() =>
    verifyJsgAccessToken(missingEntitlement.token, missingEntitlement.keys),
  );
});

test("rejects tokens lasting longer than 60 seconds and unknown kid values", async () => {
  const tooLong = await fixture({ lifetime: 61 });
  await assert.rejects(() => verifyJsgAccessToken(tooLong.token, tooLong.keys));

  const unknownKid = await fixture({ kid: "unknown" });
  await assert.rejects(() =>
    verifyJsgAccessToken(unknownKid.token, JSON.stringify({ current: "unused" })),
  );
});
