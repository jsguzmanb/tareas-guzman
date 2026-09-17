import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getTaskAgeInDays } from "@/lib/task-age";

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
      })[character] ?? character
  );
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    console.error("[daily-next-actions] CRON_SECRET no está configurado");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REMINDER_EMAIL_TO;
  const from = process.env.REMINDER_EMAIL_FROM ?? "Tareas <onboarding@resend.dev>";
  const appUrl = (
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ).replace(/\/$/, "");

  if (!apiKey || !to) {
    console.error("[daily-next-actions] Faltan variables de Resend");
    return NextResponse.json(
      { error: "RESEND_API_KEY o REMINDER_EMAIL_TO no configurados" },
      { status: 500 }
    );
  }

  try {
    const [tasks, totalTasks] = await Promise.all([
      prisma.task.findMany({
        where: { status: "NEXT_ACTION" },
        orderBy: { createdAt: "asc" },
        take: MAX_TASKS,
      }),
      prisma.task.count({ where: { status: "NEXT_ACTION" } }),
    ]);

    if (tasks.length === 0) {
      console.info("[daily-next-actions] Envío omitido: no hay tareas activas");
      return NextResponse.json({ ok: true, skipped: "sin next actions" });
    }

    const resend = new Resend(apiKey);

    const renderTask = (task: (typeof tasks)[number]) => {
      const days = getTaskAgeInDays(task.createdAt);
      const age = days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
      return `<li>${escapeHtml(task.title)} <span style="color:#999">(${age})</span></li>`;
    };

    const remaining = totalTasks - tasks.length;
    const remainingBlock =
      remaining > 0
        ? `<p>Hay ${remaining} ${remaining === 1 ? "tarea adicional" : "tareas adicionales"} en la aplicación.</p>`
        : "";
    const dateKey = new Date().toISOString().slice(0, 10);

    const { data, error } = await resend.emails.send(
      {
        from,
        to,
        subject: `Tus ${tasks.length} tareas prioritarias de hoy`,
        html: `
          <p>Empieza por estas; son tus tareas activas más antiguas:</p>
          <ol>${tasks.map(renderTask).join("")}</ol>
          ${remainingBlock}
          <p><a href="${escapeHtml(`${appUrl}/focus`)}">Abrir modo Ahora</a></p>
        `,
      },
      { idempotencyKey: `daily-next-actions-${dateKey}` }
    );

    if (error) {
      console.error("[daily-next-actions] Resend rechazó el envío", {
        name: error.name,
        message: error.message,
      });
      return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 502 });
    }

    console.info("[daily-next-actions] Correo enviado", {
      emailId: data?.id,
      sentTasks: tasks.length,
      totalTasks,
    });
    return NextResponse.json({ ok: true, emailId: data?.id, sent: tasks.length, totalTasks });
  } catch (error) {
    console.error("[daily-next-actions] Falló la ejecución", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Falló el recordatorio diario" }, { status: 500 });
  }
}
