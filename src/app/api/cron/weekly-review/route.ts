import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    console.error("[weekly-review] CRON_SECRET no está configurado");
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
    console.error("[weekly-review] Faltan variables de Resend");
    return NextResponse.json(
      { error: "RESEND_API_KEY o REMINDER_EMAIL_TO no configurados" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const dateKey = new Date().toISOString().slice(0, 10);

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to,
        subject: "Tu revisión semanal GTD te espera",
        html: `
          <p>Es viernes. Antes de cerrar la semana, tómate 10-15 minutos para tu revisión.</p>
          <p><a href="${appUrl}/review">Abrir el checklist de revisión</a></p>
        `,
      },
      { idempotencyKey: `weekly-review-${dateKey}` }
    );

    if (error) {
      console.error("[weekly-review] Resend rechazó el envío", {
        name: error.name,
        message: error.message,
      });
      return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 502 });
    }

    console.info("[weekly-review] Correo enviado", { emailId: data?.id });
    return NextResponse.json({ ok: true, emailId: data?.id });
  } catch (error) {
    console.error("[weekly-review] Falló la ejecución", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Falló el recordatorio semanal" }, { status: 500 });
  }
}
