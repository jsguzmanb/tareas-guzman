import { prisma } from "@/lib/prisma";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getCompletionStreak(ownerId: string) {
  const completions = await prisma.task.findMany({
    where: { ownerId, status: "DONE", completedAt: { not: null } },
    select: { completedAt: true },
  });

  const days = new Set(completions.map((t) => toDateKey(t.completedAt as Date)));

  const cursor = new Date();
  if (!days.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
