import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "Tareas <onboarding@resend.dev>",
    to,
    subject: "Tu revisión semanal GTD te espera",
    html: `
      <p>Es viernes. Antes de cerrar la semana, tómate 10-15 minutos para tu revisión.</p>
      <p><a href="${appUrl}/review">Abrir el checklist de revisión</a></p>
    `,
  });

  return NextResponse.json({ ok: true });
}
