import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  archiveProjectForOwner,
  deleteTaskForOwner,
  findProjectForOwner,
  findTaskForOwner,
  setTaskProjectForOwner,
  updateTaskForOwner,
} from "../src/lib/tenant-data";
import { applyMembershipEvent } from "../src/lib/membership-sync";
import { resolveShortcutOwner } from "../src/lib/shortcut-auth";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  test("tenant isolation requires TEST_DATABASE_URL", { skip: true }, () => {});
} else {
  describe("tenant isolation", () => {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
    });
    const runId = `isolation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const subjectSeed = String(Date.now());
    const ids = {
      userA: `${runId}-user-a`,
      userB: `${runId}-user-b`,
      projectA: `${runId}-project-a`,
      projectB: `${runId}-project-b`,
      taskA: `${runId}-task-a`,
      taskB: `${runId}-task-b`,
      reviewA: `${runId}-review-a`,
      reviewB: `${runId}-review-b`,
      shortcutA: `${runId}-shortcut-a`,
      consumedJti: `${runId}-jti`,
      revokeEvent: `${runId}-revoke`,
      staleEvent: `${runId}-stale-grant`,
      subjectA: `wp:${subjectSeed}1`,
      subjectB: `wp:${subjectSeed}2`,
    };

    before(async () => {
      await prisma.user.createMany({
        data: [
          {
            id: ids.userA,
            identityEmail: `${runId}-a@example.com`,
            externalSubject: ids.subjectA,
          },
          {
            id: ids.userB,
            identityEmail: `${runId}-b@example.com`,
            externalSubject: ids.subjectB,
          },
        ],
      });
      await prisma.accessGrant.createMany({
        data: [
          {
            userId: ids.userA,
            source: "MEMBERSHIP",
            entitlement: "tasks",
            sourceUpdatedAt: new Date("2026-09-18T10:00:00Z"),
          },
          {
            userId: ids.userB,
            source: "MEMBERSHIP",
            entitlement: "tasks",
            sourceUpdatedAt: new Date("2026-09-18T10:00:00Z"),
          },
        ],
      });
      await prisma.project.createMany({
        data: [
          { id: ids.projectA, ownerId: ids.userA, name: "Proyecto A" },
          { id: ids.projectB, ownerId: ids.userB, name: "Proyecto B" },
        ],
      });
      await prisma.task.createMany({
        data: [
          {
            id: ids.taskA,
            ownerId: ids.userA,
            projectId: ids.projectA,
            title: "Tarea privada A",
          },
          {
            id: ids.taskB,
            ownerId: ids.userB,
            projectId: ids.projectB,
            title: "Tarea privada B",
          },
        ],
      });
      await prisma.weeklyReview.createMany({
        data: [
          { id: ids.reviewA, ownerId: ids.userA },
          { id: ids.reviewB, ownerId: ids.userB },
        ],
      });
      const shortcutToken = `${runId}-shortcut-token`;
      await prisma.shortcutCredential.create({
        data: {
          id: ids.shortcutA,
          userId: ids.userA,
          label: "iPhone A",
          tokenPrefix: `${shortcutToken.slice(0, 11)}…`,
          tokenHash: createHash("sha256").update(shortcutToken).digest("hex"),
        },
      });
    });

    after(async () => {
      await prisma.membershipEvent.deleteMany({
        where: { eventId: { in: [ids.revokeEvent, ids.staleEvent] } },
      });
      await prisma.consumedAccessToken.deleteMany({
        where: { jti: ids.consumedJti },
      });
      await prisma.shortcutCredential.deleteMany({
        where: { id: ids.shortcutA },
      });
      await prisma.weeklyReview.deleteMany({
        where: { id: { in: [ids.reviewA, ids.reviewB] } },
      });
      await prisma.task.deleteMany({
        where: { id: { in: [ids.taskA, ids.taskB] } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: [ids.projectA, ids.projectB] } },
      });
      await prisma.notificationPreference.deleteMany({
        where: { userId: { in: [ids.userA, ids.userB] } },
      });
      await prisma.accessGrant.deleteMany({
        where: { userId: { in: [ids.userA, ids.userB] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [ids.userA, ids.userB] } },
      });
      await prisma.$disconnect();
    });

    test("lists only rows owned by the authenticated user", async () => {
      const [tasks, projects, reviews] = await Promise.all([
        prisma.task.findMany({ where: { ownerId: ids.userA } }),
        prisma.project.findMany({ where: { ownerId: ids.userA } }),
        prisma.weeklyReview.findMany({ where: { ownerId: ids.userA } }),
      ]);

      assert.deepEqual(tasks.map((row) => row.id), [ids.taskA]);
      assert.deepEqual(projects.map((row) => row.id), [ids.projectA]);
      assert.deepEqual(reviews.map((row) => row.id), [ids.reviewA]);
    });

    test("cannot fetch another user's task or project by ID", async () => {
      assert.equal(await findTaskForOwner(prisma, ids.userA, ids.taskB), null);
      assert.equal(await findProjectForOwner(prisma, ids.userA, ids.projectB), null);
    });

    test("cannot edit, delete, or archive another user's rows", async () => {
      assert.equal(
        await updateTaskForOwner(prisma, ids.userA, ids.taskB, {
          title: "Intento de intrusión",
        }),
        false,
      );
      assert.equal(await deleteTaskForOwner(prisma, ids.userA, ids.taskB), false);
      assert.equal(
        await archiveProjectForOwner(prisma, ids.userA, ids.projectB),
        false,
      );

      const [taskB, projectB] = await Promise.all([
        prisma.task.findUniqueOrThrow({ where: { id: ids.taskB } }),
        prisma.project.findUniqueOrThrow({ where: { id: ids.projectB } }),
      ]);
      assert.equal(taskB.title, "Tarea privada B");
      assert.equal(projectB.archived, false);
    });

    test("cannot attach a task to another user's project", async () => {
      assert.equal(
        await setTaskProjectForOwner(
          prisma,
          ids.userA,
          ids.taskA,
          ids.projectB,
        ),
        false,
      );

      const taskA = await prisma.task.findUniqueOrThrow({ where: { id: ids.taskA } });
      assert.equal(taskA.projectId, ids.projectA);
    });

    test("resolves shortcut credentials to one owner and rejects them after revocation", async () => {
      const token = `${runId}-shortcut-token`;
      assert.equal(
        await resolveShortcutOwner(prisma, token, {}),
        ids.userA,
      );

      await prisma.shortcutCredential.update({
        where: { id: ids.shortcutA },
        data: { revokedAt: new Date() },
      });
      assert.equal(await resolveShortcutOwner(prisma, token, {}), null);
    });

    test("keeps each user's tasks in a separate reminder query", async () => {
      const [tasksA, tasksB] = await Promise.all([
        prisma.task.findMany({ where: { ownerId: ids.userA } }),
        prisma.task.findMany({ where: { ownerId: ids.userB } }),
      ]);
      assert.deepEqual(tasksA.map((task) => task.id), [ids.taskA]);
      assert.deepEqual(tasksB.map((task) => task.id), [ids.taskB]);
    });

    test("consumes each access jti only once", async () => {
      const data = {
        jti: ids.consumedJti,
        issuer: "https://juansguzman.com",
        subject: ids.subjectA,
        expiresAt: new Date(Date.now() + 60_000),
      };
      await prisma.consumedAccessToken.create({ data });
      await assert.rejects(() => prisma.consumedAccessToken.create({ data }));
    });

    test("revokes membership without deleting data and ignores an older reactivation", async () => {
      const revokedAt = new Date("2026-09-18T12:00:00Z");
      assert.equal(
        await prisma.$transaction((tx) =>
          applyMembershipEvent(tx, {
            eventId: ids.revokeEvent,
            subject: ids.subjectB,
            email: `${runId}-b@example.com`,
            entitlement: "tasks",
            active: false,
            status: "canceled",
            occurredAt: revokedAt,
          }),
        ),
        "applied",
      );
      assert.equal(
        await prisma.$transaction((tx) =>
          applyMembershipEvent(tx, {
            eventId: ids.staleEvent,
            subject: ids.subjectB,
            email: `${runId}-b@example.com`,
            entitlement: "tasks",
            active: true,
            status: "active",
            occurredAt: new Date("2026-09-18T11:59:59Z"),
          }),
        ),
        "out_of_order",
      );

      const [grant, task] = await Promise.all([
        prisma.accessGrant.findUniqueOrThrow({
          where: {
            userId_source_entitlement: {
              userId: ids.userB,
              source: "MEMBERSHIP",
              entitlement: "tasks",
            },
          },
        }),
        prisma.task.findUniqueOrThrow({ where: { id: ids.taskB } }),
      ]);
      assert.equal(grant.active, false);
      assert.equal(grant.sourceUpdatedAt?.toISOString(), revokedAt.toISOString());
      assert.equal(task.ownerId, ids.userB);
    });
  });
}
