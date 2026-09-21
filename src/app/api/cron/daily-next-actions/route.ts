import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getTaskAgeInDays } from "@/lib/task-age";
import { getLocalSchedule } from "@/lib/reminder-time";

const MAX_TASKS = 5;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

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
      dailyReminderEnabled: true,
      user: {
        accessGrants: { some: { entitlement: "tasks", active: true } },
      },
    },
    select: {
      userId: true,
      notificationEmail: true,
      timeZone: true,
      dailyReminderHour: true,
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
    if (local.hour !== recipient.dailyReminderHour) {
      skipped++;
      continue;
    }

    const [tasks, totalTasks] = await Promise.all([
      prisma.task.findMany({
        where: { ownerId: recipient.userId, status: "NEXT_ACTION" },
        orderBy: { createdAt: "asc" },
        take: MAX_TASKS,
      }),
      prisma.task.count({
        where: { ownerId: recipient.userId, status: "NEXT_ACTION" },
      }),
    ]);

    if (tasks.length === 0) {
      skipped++;
      continue;
    }

    const remaining = totalTasks - tasks.length;
    const remainingBlock =
      remaining > 0
        ? `<p>Hay ${remaining} ${remaining === 1 ? "tarea adicional" : "tareas adicionales"} en la aplicación.</p>`
        : "";
    const taskItems = tasks
      .map((task) => {
        const days = getTaskAgeInDays(task.createdAt);
        const age = days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
        return `<li>${escapeHtml(task.title)} <span style="color:#999">(${age})</span></li>`;
      })
      .join("");

    const { error } = await resend.emails.send(
      {
        from,
        to: recipient.notificationEmail,
        subject: `Tus ${tasks.length} tareas prioritarias de hoy`,
        html: `
          <p>Empieza por estas; son tus tareas activas más antiguas:</p>
          <ol>${taskItems}</ol>
          ${remainingBlock}
          <p><a href="${escapeHtml(`${appUrl}/focus`)}">Abrir modo Ahora</a></p>
        `,
      },
      {
        idempotencyKey: `daily-next-actions-${recipient.userId}-${local.dateKey}`,
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
