import { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { IdentityConflictError } from "@/lib/jsg-identity";
import {
  parseJsgMembershipEvent,
  verifyJsgWebhookSignature,
} from "@/lib/jsg-webhook";
import { applyMembershipEvent } from "@/lib/membership-sync";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const secret = process.env.JSG_MEMBERSHIP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[jsg-membership] JSG_MEMBERSHIP_WEBHOOK_SECRET no configurado");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 64_000) {
    return NextResponse.json({ error: "Payload demasiado grande" }, { status: 413 });
  }
  const timestamp = request.headers.get("x-jsg-timestamp") ?? "";
  const signature = request.headers.get("x-jsg-signature") ?? "";
  if (!verifyJsgWebhookSignature({ rawBody, timestamp, signature, secret })) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let event;
  try {
    event = parseJsgMembershipEvent(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  if (event.occurredAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return NextResponse.json({ error: "Evento fechado en el futuro" }, { status: 400 });
  }

  try {
    const status = await prisma.$transaction(
      (tx) => applyMembershipEvent(tx, event),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, status: "duplicate" });
    }
    if (error instanceof IdentityConflictError) {
      return NextResponse.json({ error: "Conflicto de identidad" }, { status: 409 });
    }
    console.error("[jsg-membership] no se pudo aplicar el evento", error);
    return NextResponse.json({ error: "No se pudo aplicar el evento" }, { status: 500 });
  }
}
