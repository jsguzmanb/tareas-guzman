import type { Prisma } from "@/generated/prisma/client";
import {
  findJsgUser,
  resolveJsgUser,
} from "@/lib/jsg-identity";
import {
  isNewerAccessEvent,
  type JsgMembershipEvent,
} from "@/lib/jsg-webhook";

type SyncResult = "applied" | "duplicate" | "out_of_order";

export async function applyMembershipEvent(
  tx: Prisma.TransactionClient,
  event: JsgMembershipEvent,
): Promise<SyncResult> {
  const duplicate = await tx.membershipEvent.findUnique({
    where: { eventId: event.eventId },
    select: { eventId: true },
  });
  if (duplicate) return "duplicate";

  const candidate = await findJsgUser(tx, event);
  if (candidate) {
    const currentGrant = await tx.accessGrant.findUnique({
      where: {
        userId_source_entitlement: {
          userId: candidate.id,
          source: "MEMBERSHIP",
          entitlement: event.entitlement,
        },
      },
    });

    if (currentGrant && !isNewerAccessEvent(currentGrant.sourceUpdatedAt, event.occurredAt)) {
      await tx.membershipEvent.create({
        data: {
          eventId: event.eventId,
          userId: candidate.id,
          subject: event.subject,
          entitlement: event.entitlement,
          active: event.active,
          sourceStatus: event.status,
          occurredAt: event.occurredAt,
          applied: false,
        },
      });
      return "out_of_order";
    }
  }

  const user = await resolveJsgUser(tx, event);
  await tx.accessGrant.upsert({
    where: {
      userId_source_entitlement: {
        userId: user.id,
        source: "MEMBERSHIP",
        entitlement: event.entitlement,
      },
    },
    update: {
      active: event.active,
      sourceStatus: event.status,
      sourceUpdatedAt: event.occurredAt,
    },
    create: {
      userId: user.id,
      source: "MEMBERSHIP",
      entitlement: event.entitlement,
      active: event.active,
      sourceStatus: event.status,
      sourceUpdatedAt: event.occurredAt,
    },
  });
  await tx.membershipEvent.create({
    data: {
      eventId: event.eventId,
      userId: user.id,
      subject: event.subject,
      entitlement: event.entitlement,
      active: event.active,
      sourceStatus: event.status,
      occurredAt: event.occurredAt,
      applied: true,
    },
  });
  return "applied";
}
