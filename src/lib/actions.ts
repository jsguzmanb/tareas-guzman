"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NEXT_ACTION_LIMIT } from "@/lib/constants";
import { requireActiveUser } from "@/lib/dal";
import {
  archiveProjectForOwner,
  deleteTaskForOwner,
  setTaskProjectForOwner,
  updateTaskForOwner,
} from "@/lib/tenant-data";

function revalidateTaskViews() {
  revalidatePath("/", "layout");
}

export async function createInboxTask(formData: FormData) {
  const user = await requireActiveUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const projectIdValue = formData.get("projectId");
  const projectId = projectIdValue ? String(projectIdValue) : null;

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
      select: { id: true },
    });
    if (!project) return;
  }

  await prisma.task.create({
    data: {
      ownerId: user.id,
      title,
      status: "INBOX",
      projectId,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidateTaskViews();
}

export async function createSomedayTask(formData: FormData) {
  const user = await requireActiveUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.task.create({
    data: { ownerId: user.id, title, status: "SOMEDAY" },
  });

  revalidatePath("/someday");
}

export async function promoteToNextAction(taskId: string) {
  const user = await requireActiveUser();
  const activeCount = await prisma.task.count({
    where: { ownerId: user.id, status: "NEXT_ACTION" },
  });

  if (activeCount >= NEXT_ACTION_LIMIT) {
    return { error: `Ya tienes ${NEXT_ACTION_LIMIT} next actions activas. Termina o mueve alguna antes de agregar otra.` };
  }

  await updateTaskForOwner(prisma, user.id, taskId, { status: "NEXT_ACTION" });

  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/focus");
  revalidateTaskViews();
  return { error: null };
}

export async function sendToSomeday(taskId: string) {
  const user = await requireActiveUser();
  await updateTaskForOwner(prisma, user.id, taskId, { status: "SOMEDAY" });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function sendToInbox(taskId: string) {
  const user = await requireActiveUser();
  await updateTaskForOwner(prisma, user.id, taskId, { status: "INBOX" });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function completeTask(taskId: string) {
  const user = await requireActiveUser();
  await updateTaskForOwner(prisma, user.id, taskId, {
    status: "DONE",
    completedAt: new Date(),
  });
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/projects");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function deleteTask(taskId: string) {
  const user = await requireActiveUser();
  await deleteTaskForOwner(prisma, user.id, taskId);
  revalidatePath("/");
  revalidatePath("/next-actions");
  revalidatePath("/someday");
  revalidatePath("/review");
  revalidatePath("/projects");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function updateTaskProject(taskId: string, projectId: string | null) {
  const user = await requireActiveUser();
  await setTaskProjectForOwner(prisma, user.id, taskId, projectId);
  revalidatePath("/next-actions");
  revalidatePath("/projects");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function updateTaskContext(taskId: string, context: string) {
  const user = await requireActiveUser();
  await updateTaskForOwner(prisma, user.id, taskId, {
    context: context.trim() || null,
  });
  revalidatePath("/next-actions");
  revalidatePath("/projects");
  revalidatePath("/focus");
  revalidateTaskViews();
}

export async function updateTaskTentativeDate(taskId: string, tentativeDate: string) {
  const user = await requireActiveUser();
  const parsedDate = tentativeDate ? new Date(`${tentativeDate}T00:00:00.000Z`) : null;

  if (parsedDate && Number.isNaN(parsedDate.getTime())) {
    return;
  }

  await updateTaskForOwner(prisma, user.id, taskId, { tentativeDate: parsedDate });
  revalidatePath("/next-actions");
  revalidatePath("/projects");
  revalidateTaskViews();
}

export async function createProject(formData: FormData) {
  const user = await requireActiveUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.project.create({ data: { ownerId: user.id, name } });
  revalidatePath("/projects");
}

export async function archiveProject(projectId: string) {
  const user = await requireActiveUser();
  await archiveProjectForOwner(prisma, user.id, projectId);
  revalidatePath("/projects");
}

export async function recordWeeklyReviewCompletion() {
  const user = await requireActiveUser();
  await prisma.weeklyReview.create({ data: { ownerId: user.id } });
  revalidatePath("/review");
}
