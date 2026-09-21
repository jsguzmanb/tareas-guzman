import { createHash, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

type ShortcutDb = Pick<PrismaClient, "shortcutCredential" | "user">;

function equalSecrets(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function resolveShortcutOwner(
  db: ShortcutDb,
  token: string,
  legacyConfig: {
    secret?: string;
    adminEmail?: string;
    adminUsername?: string;
  } = {
    secret: process.env.SHORTCUTS_SECRET,
    adminEmail: process.env.ADMIN_EMAIL,
    adminUsername: process.env.ADMIN_USERNAME,
  },
) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const credential = await db.shortcutCredential.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      user: {
        accessGrants: {
          some: { entitlement: "tasks", active: true },
        },
      },
    },
    select: { id: true, userId: true },
  });

  if (credential) {
    await db.shortcutCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });
    return credential.userId;
  }

  const legacySecret = legacyConfig.secret;
  if (!legacySecret || !equalSecrets(token, legacySecret)) return null;

  const adminEmail = legacyConfig.adminEmail?.trim().toLowerCase();
  const adminUsername = legacyConfig.adminUsername;
  if (!adminEmail && !adminUsername) return null;

  const legacyOwner = await db.user.findFirst({
    where: {
      OR: [
        ...(adminEmail ? [{ identityEmail: adminEmail }] : []),
        ...(adminUsername ? [{ username: adminUsername }] : []),
      ],
      accessGrants: {
        some: { entitlement: "tasks", active: true },
      },
    },
    select: { id: true },
  });

  return legacyOwner?.id ?? null;
}
