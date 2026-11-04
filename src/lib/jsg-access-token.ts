import {
  decodeProtectedHeader,
  importSPKI,
  jwtVerify,
  type JWTPayload,
} from "jose";

const EXPECTED_ISSUER = "https://juansguzman.com";
const EXPECTED_AUDIENCE = "tareas-guzman";
const MAX_TOKEN_LIFETIME_SECONDS = 60;

export type JsgAccessClaims = {
  subject: string;
  email: string;
  jti: string;
  issuedAt: Date;
  expiresAt: Date;
};

function readPublicKeys(value = process.env.JSG_ACCESS_PUBLIC_KEYS_JSON) {
  if (!value) throw new Error("JSG_ACCESS_PUBLIC_KEYS_JSON is not set");

  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSG_ACCESS_PUBLIC_KEYS_JSON must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

function stringClaim(payload: JWTPayload, name: string) {
  const value = payload[name];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing ${name} claim`);
  }
  return value;
}

export async function verifyJsgAccessToken(
  token: string,
  publicKeysJson?: string,
): Promise<JsgAccessClaims> {
  if (!token || token.length > 8_192) throw new Error("Invalid access token");

  const header = decodeProtectedHeader(token);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new Error("Invalid access token header");
  }

  const publicKeyValue = readPublicKeys(publicKeysJson)[header.kid];
  if (typeof publicKeyValue !== "string" || !publicKeyValue) {
    throw new Error("Unknown access token key");
  }

  const publicKey = await importSPKI(publicKeyValue, "RS256");
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: EXPECTED_ISSUER,
    audience: EXPECTED_AUDIENCE,
    clockTolerance: 5,
    maxTokenAge: `${MAX_TOKEN_LIFETIME_SECONDS}s`,
  });

  const subject = stringClaim(payload, "sub");
  const email = stringClaim(payload, "email").trim().toLowerCase();
  const jti = stringClaim(payload, "jti");
  const entitlements = payload.entitlements;
  const access = payload.access;

  if (!/^wp:[1-9]\d*$/.test(subject)) throw new Error("Invalid subject");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  if (jti.length > 255) throw new Error("Invalid jti");
  if (!Array.isArray(entitlements) || !entitlements.includes("tasks")) {
    throw new Error("Missing tasks entitlement");
  }
  if (access !== "active") throw new Error("Inactive tasks access");
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number") {
    throw new Error("Missing token timestamps");
  }
  if (payload.exp <= payload.iat || payload.exp - payload.iat > MAX_TOKEN_LIFETIME_SECONDS) {
    throw new Error("Invalid token lifetime");
  }

  return {
    subject,
    email,
    jti,
    issuedAt: new Date(payload.iat * 1000),
    expiresAt: new Date(payload.exp * 1000),
  };
}
