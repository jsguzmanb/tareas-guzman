import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const enabled =
    process.env.ALLOW_TECHNICAL_LOGIN === "true" ||
    process.env.NODE_ENV !== "production";
  if (!enabled) {
    return NextResponse.json({ error: "Acceso técnico deshabilitado" }, { status: 404 });
  }

  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const hasTechnicalAccess = await prisma.accessGrant.findFirst({
    where: {
      userId: user.id,
      entitlement: "tasks",
      active: true,
      source: "TECHNICAL",
    },
    select: { id: true },
  });

  if (!hasTechnicalAccess) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
