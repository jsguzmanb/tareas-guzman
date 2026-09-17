import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_TITLE_LENGTH = 500;

export async function POST(request: NextRequest) {
  const secret = process.env.SHORTCUTS_SECRET;

  if (!secret) {
    console.error("SHORTCUTS_SECRET is not set");
    return NextResponse.json(
      { error: "El servicio no está configurado" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title =
    typeof body === "object" &&
    body !== null &&
    "title" in body &&
    typeof body.title === "string"
      ? body.title.trim()
      : "";

  if (!title) {
    return NextResponse.json(
      { error: "La tarea necesita un título" },
      { status: 400 },
    );
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres` },
      { status: 400 },
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      status: "INBOX",
    },
    select: {
      id: true,
      title: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, task }, { status: 201 });
}
