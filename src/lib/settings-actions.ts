"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/dal";

type TokenResult = { token: string | null; error: string | null };

function generateShortcutToken() {
  const token = `tg_${randomBytes(32).toString("base64url")}`;
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    tokenPrefix: `${token.slice(0, 11)}…`,
  };
}

function validTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export async function createShortcutCredential(label: string): Promise<TokenResult> {
  const user = await requireActiveUser();
  const cleanLabel = label.trim().slice(0, 80);
  if (!cleanLabel) return { token: null, error: "Escribe un nombre para el Atajo." };

  const generated = generateShortcutToken();
  await prisma.shortcutCredential.create({
    data: {
      userId: user.id,
      label: cleanLabel,
      tokenHash: generated.tokenHash,
      tokenPrefix: generated.tokenPrefix,
    },
  });
  revalidatePath("/settings");
  return { token: generated.token, error: null };
}

export async function revokeShortcutCredential(credentialId: string) {
  const user = await requireActiveUser();
  await prisma.shortcutCredential.updateMany({
    where: { id: credentialId, userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/settings");
}

export async function regenerateShortcutCredential(
  credentialId: string,
): Promise<TokenResult> {
  const user = await requireActiveUser();
  const credential = await prisma.shortcutCredential.findFirst({
    where: { id: credentialId, userId: user.id },
    select: { id: true, label: true },
  });
  if (!credential) return { token: null, error: "Credencial no encontrada." };

  const generated = generateShortcutToken();
  await prisma.$transaction([
    prisma.shortcutCredential.update({
      where: { id: credential.id },
      data: { revokedAt: new Date() },
    }),
    prisma.shortcutCredential.create({
      data: {
        userId: user.id,
        label: credential.label,
        tokenHash: generated.tokenHash,
        tokenPrefix: generated.tokenPrefix,
      },
    }),
  ]);
  revalidatePath("/settings");
  return { token: generated.token, error: null };
}

export async function updateNotificationPreference(formData: FormData) {
  const user = await requireActiveUser();
  const notificationEmail = String(formData.get("notificationEmail") ?? "")
    .trim()
    .toLowerCase();
  const timeZone = String(formData.get("timeZone") ?? "").trim();
  const dailyReminderHour = Number(formData.get("dailyReminderHour"));
  const weeklyReminderWeekday = Number(formData.get("weeklyReminderWeekday"));
  const weeklyReminderHour = Number(formData.get("weeklyReminderHour"));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
    return { error: "El correo de notificación no es válido." };
  }
  if (!validTimeZone(timeZone)) return { error: "La zona horaria no es válida." };
  if (
    !Number.isInteger(dailyReminderHour) ||
    dailyReminderHour < 0 ||
    dailyReminderHour > 23 ||
    !Number.isInteger(weeklyReminderWeekday) ||
    weeklyReminderWeekday < 0 ||
    weeklyReminderWeekday > 6 ||
    !Number.isInteger(weeklyReminderHour) ||
    weeklyReminderHour < 0 ||
    weeklyReminderHour > 23
  ) {
    return { error: "La programación de recordatorios no es válida." };
  }

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {
      notificationEmail,
      timeZone,
      dailyReminderEnabled: formData.get("dailyReminderEnabled") === "on",
      dailyReminderHour,
      weeklyReminderEnabled: formData.get("weeklyReminderEnabled") === "on",
      weeklyReminderWeekday,
      weeklyReminderHour,
    },
    create: {
      userId: user.id,
      notificationEmail,
      timeZone,
      dailyReminderEnabled: formData.get("dailyReminderEnabled") === "on",
      dailyReminderHour,
      weeklyReminderEnabled: formData.get("weeklyReminderEnabled") === "on",
      weeklyReminderWeekday,
      weeklyReminderHour,
    },
  });
  revalidatePath("/settings");
  return { error: null };
}
