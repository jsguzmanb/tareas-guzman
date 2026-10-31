import type { PrismaClient } from "@/generated/prisma/client";
import { getLocalSchedule } from "@/lib/reminder-time";

type RoutineDb = Pick<PrismaClient, "notificationPreference" | "routine" | "task">;

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function scheduledDateForWeek(dateKey: string, currentWeekday: number, weekday: number) {
  return addDays(dateKey, -((currentWeekday - weekday + 7) % 7));
}

/**
 * Creates the current weekly occurrence when it is due. A routine never creates
 * a second Inbox task while an earlier occurrence is still open.
 */
export async function syncWeeklyRoutinesForOwner(
  db: RoutineDb,
  ownerId: string,
  now = new Date(),
) {
  const preference = await db.notificationPreference.findUnique({
    where: { userId: ownerId },
    select: { timeZone: true },
  });
  const timeZone = preference?.timeZone ?? "UTC";
  const local = getLocalSchedule(now, timeZone);
  const routines = await db.routine.findMany({
    where: { ownerId, pausedAt: null },
    orderBy: { createdAt: "asc" },
  });

  for (const routine of routines) {
    const scheduledFor = scheduledDateForWeek(local.dateKey, local.weekday, routine.weekday);
    const createdOn = getLocalSchedule(routine.createdAt, timeZone).dateKey;

    if (scheduledFor < createdOn || routine.lastScheduledFor === scheduledFor) continue;

    const pendingTask = await db.task.findFirst({
      where: { ownerId, routineId: routine.id, status: { not: "DONE" } },
      select: { id: true },
    });

    if (!pendingTask) {
      await db.task.upsert({
        where: {
          routineId_routineScheduledFor: {
            routineId: routine.id,
            routineScheduledFor: scheduledFor,
          },
        },
        create: {
          ownerId,
          routineId: routine.id,
          routineScheduledFor: scheduledFor,
          title: routine.title,
          status: "INBOX",
          tentativeDate: new Date(`${scheduledFor}T00:00:00.000Z`),
        },
        update: {},
      });
    }

    await db.routine.updateMany({
      where: { id: routine.id, ownerId, lastScheduledFor: routine.lastScheduledFor },
      data: { lastScheduledFor: scheduledFor },
    });
  }
}
