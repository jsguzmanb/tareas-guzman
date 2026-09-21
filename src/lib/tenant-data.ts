import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export type TenantDb = Pick<PrismaClient, "project" | "task" | "weeklyReview">;

export function findTaskForOwner(db: TenantDb, ownerId: string, taskId: string) {
  return db.task.findFirst({ where: { id: taskId, ownerId } });
}

export function findProjectForOwner(
  db: TenantDb,
  ownerId: string,
  projectId: string,
) {
  return db.project.findFirst({ where: { id: projectId, ownerId } });
}

export async function updateTaskForOwner(
  db: TenantDb,
  ownerId: string,
  taskId: string,
  data: Prisma.TaskUpdateManyMutationInput,
) {
  const result = await db.task.updateMany({
    where: { id: taskId, ownerId },
    data,
  });
  return result.count === 1;
}

export async function deleteTaskForOwner(
  db: TenantDb,
  ownerId: string,
  taskId: string,
) {
  const result = await db.task.deleteMany({ where: { id: taskId, ownerId } });
  return result.count === 1;
}

export async function archiveProjectForOwner(
  db: TenantDb,
  ownerId: string,
  projectId: string,
) {
  const result = await db.project.updateMany({
    where: { id: projectId, ownerId },
    data: { archived: true },
  });
  return result.count === 1;
}

export async function setTaskProjectForOwner(
  db: TenantDb,
  ownerId: string,
  taskId: string,
  projectId: string | null,
) {
  if (projectId) {
    const project = await findProjectForOwner(db, ownerId, projectId);
    if (!project) return false;
  }

  const task = await findTaskForOwner(db, ownerId, taskId);
  if (!task) return false;

  await db.task.update({
    where: { id_ownerId: { id: taskId, ownerId } },
    data: projectId
      ? {
          project: {
            connect: { id_ownerId: { id: projectId, ownerId } },
          },
        }
      : { project: { disconnect: true } },
  });
  return true;
}
