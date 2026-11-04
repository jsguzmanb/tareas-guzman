import type { Prisma } from "@/generated/prisma/client";
import type { JsgAccessClaims } from "@/lib/jsg-access-token";

export class IdentityConflictError extends Error {}

type IdentityInput = {
  subject: string;
  email: string;
};

type InitialNotificationConfig = {
  adminEmail?: string;
  adminNotificationEmail?: string;
  adminTimeZone?: string;
};

export function getInitialNotificationPreference(
  identityEmail: string,
  config: InitialNotificationConfig = {
    adminEmail: process.env.ADMIN_EMAIL,
    adminNotificationEmail: process.env.REMINDER_EMAIL_TO,
    adminTimeZone: process.env.ADMIN_TIME_ZONE,
  },
) {
  const normalizedIdentityEmail = identityEmail.trim().toLowerCase();
  const normalizedAdminEmail = config.adminEmail?.trim().toLowerCase();
  const isAdmin =
    Boolean(normalizedAdminEmail) &&
    normalizedAdminEmail === normalizedIdentityEmail;

  return {
    notificationEmail:
      (isAdmin && config.adminNotificationEmail?.trim().toLowerCase()) ||
      normalizedIdentityEmail,
    timeZone: (isAdmin && config.adminTimeZone?.trim()) || "UTC",
  };
}

export async function findJsgUser(
  tx: Prisma.TransactionClient,
  identity: IdentityInput,
) {
  const [bySubject, byEmail] = await Promise.all([
    tx.user.findUnique({ where: { externalSubject: identity.subject } }),
    tx.user.findUnique({ where: { identityEmail: identity.email } }),
  ]);

  if (bySubject && byEmail && bySubject.id !== byEmail.id) {
    throw new IdentityConflictError("Subject and email belong to different users");
  }

  if (bySubject || byEmail) return bySubject ?? byEmail;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME;
  if (adminEmail === identity.email && adminUsername) {
    return tx.user.findUnique({ where: { username: adminUsername } });
  }

  return null;
}

export async function resolveJsgUser(
  tx: Prisma.TransactionClient,
  identity: IdentityInput,
) {
  const existing = await findJsgUser(tx, identity);
  const user = existing
    ? await tx.user.update({
        where: { id: existing.id },
        data: {
          identityEmail: identity.email,
          externalSubject: identity.subject,
        },
      })
    : await tx.user.create({
        data: {
          identityEmail: identity.email,
          externalSubject: identity.subject,
        },
      });

  const initialNotificationPreference = getInitialNotificationPreference(
    identity.email,
  );

  await tx.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...initialNotificationPreference,
    },
  });

  return user;
}

export async function consumeJsgAccessToken(
  tx: Prisma.TransactionClient,
  claims: JsgAccessClaims,
) {
  await tx.consumedAccessToken.create({
    data: {
      jti: claims.jti,
      issuer: "https://juansguzman.com",
      subject: claims.subject,
      expiresAt: claims.expiresAt,
    },
  });

  const user = await resolveJsgUser(tx, claims);
  const existingGrant = await tx.accessGrant.findUnique({
    where: {
      userId_source_entitlement: {
        userId: user.id,
        source: "MEMBERSHIP",
        entitlement: "tasks",
      },
    },
  });

  if (!existingGrant) {
    await tx.accessGrant.create({
      data: {
        userId: user.id,
        source: "MEMBERSHIP",
        entitlement: "tasks",
        active: true,
        sourceStatus: "jwt",
        sourceUpdatedAt: claims.issuedAt,
      },
    });
  } else if (
    !existingGrant.sourceUpdatedAt ||
    existingGrant.sourceUpdatedAt < claims.issuedAt
  ) {
    await tx.accessGrant.update({
      where: { id: existingGrant.id },
      data: {
        active: true,
        sourceStatus: "jwt",
        sourceUpdatedAt: claims.issuedAt,
      },
    });
  }

  const membershipGrant = await tx.accessGrant.findUniqueOrThrow({
    where: {
      userId_source_entitlement: {
        userId: user.id,
        source: "MEMBERSHIP",
        entitlement: "tasks",
      },
    },
    select: { active: true },
  });

  return { userId: user.id, membershipActive: membershipGrant.active };
}
