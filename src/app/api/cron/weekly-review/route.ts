import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getLocalSchedule } from "@/lib/reminder-time";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_EMAIL_FROM ?? "Tareas <onboarding@resend.dev>";
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurado" }, { status: 500 });
  }

  const appUrl = (
    process.env.APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
  ).replace(/\/$/, "");
  const now = new Date();
  const recipients = await prisma.notificationPreference.findMany({
    where: {
      weeklyReminderEnabled: true,
      user: {
        accessGrants: { some: { entitlement: "tasks", active: true } },
      },
    },
    select: {
      userId: true,
      notificationEmail: true,
      timeZone: true,
      weeklyReminderWeekday: true,
      weeklyReminderHour: true,
    },
  });

  const resend = new Resend(apiKey);
  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const recipient of recipients) {
    let local;
    try {
      local = getLocalSchedule(now, recipient.timeZone);
    } catch {
      failures.push(recipient.userId);
      continue;
    }
    if (
      local.weekday !== recipient.weeklyReminderWeekday ||
      local.hour !== recipient.weeklyReminderHour
    ) {
      skipped++;
      continue;
    }

    const { error } = await resend.emails.send(
      {
        from,
        to: recipient.notificationEmail,
        subject: "Tu revisión semanal GTD te espera",
        html: `
          <p>Antes de cerrar la semana, tómate 10-15 minutos para tu revisión.</p>
          <p><a href="${appUrl}/review">Abrir el checklist de revisión</a></p>
        `,
      },
      {
        idempotencyKey: `weekly-review-${recipient.userId}-${local.dateKey}`,
      },
    );

    if (error) failures.push(recipient.userId);
    else sent++;
  }

  return NextResponse.json(
    { ok: failures.length === 0, sent, skipped, failures: failures.length },
    { status: failures.length === 0 ? 200 : 502 },
  );
}
