"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NEXT_ACTION_LIMIT } from "@/lib/constants";

export async function createInboxTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const projectId = formData.get("projectId");

  await prisma.task.create({
    data: {
      title,
      status: "INBOX",
      projectId: projectId ? String(projectId) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
}

export async function createSomedayTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.task.create({
    data: { title, status: "SOMEDAY" },
  });

  revalidatePath("/someday");
}

export async function promoteToNextAction(taskId: string) {
  const activeCount = await prisma.task.count({
    where: { status: "NEXT_ACTION" },
  });

  if (activeCount >= NEXT_ACTION_LIMIT) {
    return { error: `Ya tienes ${NEXT_ACTION_LIMIT} next actions activas. Termina o mueve alguna antes de agregar otra.` };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "NEXT_ACTION" },
  });

  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  return { error: null };
}

export async function sendToSomeday(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "SOMEDAY" },
  });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
}

export async function sendToInbox(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "INBOX" },
  });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
}

export async function completeTask(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "DONE", completedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/projects");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/projects");
}

export async function updateTaskProject(taskId: string, projectId: string | null) {
  await prisma.task.update({
    where: { id: taskId },
    data: { projectId },
  });
  revalidatePath("/next-actions");
  revalidatePath("/projects");
}

export async function updateTaskContext(taskId: string, context: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { context: context.trim() || null },
  });
  revalidatePath("/next-actions");
}

export async function updateTaskTentativeDate(taskId: string, tentativeDate: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { tentativeDate: tentativeDate ? new Date(tentativeDate) : null },
  });
  revalidatePath("/next-actions");
  revalidatePath("/projects");
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.project.create({ data: { name } });
  revalidatePath("/projects");
}

export async function archiveProject(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { archived: true },
  });
  revalidatePath("/projects");
}

export async function recordWeeklyReviewCompletion() {
  await prisma.weeklyReview.create({ data: {} });
  revalidatePath("/review");
}
