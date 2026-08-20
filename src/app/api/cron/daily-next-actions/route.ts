import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REMINDER_EMAIL_TO;
  const appUrl =
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "RESEND_API_KEY o REMINDER_EMAIL_TO no configurados" },
      { status: 500 }
    );
  }

  const tasks = await prisma.task.findMany({
    where: { status: "NEXT_ACTION" },
    orderBy: { createdAt: "asc" },
  });

  if (tasks.length === 0) {
    return NextResponse.json({ ok: true, skipped: "sin next actions" });
  }

  const resend = new Resend(apiKey);

  const items = tasks
    .map((task) => {
      const days = daysSince(task.createdAt);
      const age = days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
      return `<li>${task.title} <span style="color:#999">(${age})</span></li>`;
    })
    .join("");

  await resend.emails.send({
    from: "Tareas <onboarding@resend.dev>",
    to,
    subject: `Tus ${tasks.length} next actions de hoy`,
    html: `
      <p>Esto es lo que tienes activo en Next Actions:</p>
      <ul>${items}</ul>
      <p><a href="${appUrl}/next-actions">Abrir Next Actions</a></p>
    `,
  });

  return NextResponse.json({ ok: true, sent: tasks.length });
}
