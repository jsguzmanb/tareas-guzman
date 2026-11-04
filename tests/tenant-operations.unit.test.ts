import assert from "node:assert/strict";
import test from "node:test";
import type { TenantDb } from "../src/lib/tenant-data";
import {
  archiveProjectForOwner,
  deleteTaskForOwner,
  findProjectForOwner,
  findTaskForOwner,
  setTaskProjectForOwner,
  updateTaskForOwner,
} from "../src/lib/tenant-data";

type ProjectRow = { id: string; ownerId: string; archived: boolean };
type TaskRow = {
  id: string;
  ownerId: string;
  projectId: string | null;
  title: string;
};

function createTwoUserDatabase() {
  const projects: ProjectRow[] = [
    { id: "project-a", ownerId: "user-a", archived: false },
    { id: "project-b", ownerId: "user-b", archived: false },
  ];
  const tasks: TaskRow[] = [
    {
      id: "task-a",
      ownerId: "user-a",
      projectId: "project-a",
      title: "Privada A",
    },
    {
      id: "task-b",
      ownerId: "user-b",
      projectId: "project-b",
      title: "Privada B",
    },
  ];

  const db = {
    project: {
      findFirst: async ({ where }: { where: { id: string; ownerId: string } }) =>
        projects.find(
          (project) =>
            project.id === where.id && project.ownerId === where.ownerId,
        ) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; ownerId: string };
        data: { archived: boolean };
      }) => {
        const project = projects.find(
          (row) => row.id === where.id && row.ownerId === where.ownerId,
        );
        if (!project) return { count: 0 };
        Object.assign(project, data);
        return { count: 1 };
      },
    },
    task: {
      findFirst: async ({ where }: { where: { id: string; ownerId: string } }) =>
        tasks.find((task) => task.id === where.id && task.ownerId === where.ownerId) ??
        null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; ownerId: string };
        data: Partial<TaskRow>;
      }) => {
        const taskRow = tasks.find(
          (row) => row.id === where.id && row.ownerId === where.ownerId,
        );
        if (!taskRow) return { count: 0 };
        Object.assign(taskRow, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }: { where: { id: string; ownerId: string } }) => {
        const index = tasks.findIndex(
          (row) => row.id === where.id && row.ownerId === where.ownerId,
        );
        if (index < 0) return { count: 0 };
        tasks.splice(index, 1);
        return { count: 1 };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id_ownerId: { id: string; ownerId: string } };
        data: {
          project: {
            connect?: { id_ownerId: { id: string; ownerId: string } };
            disconnect?: boolean;
          };
        };
      }) => {
        const taskRow = tasks.find(
          (row) =>
            row.id === where.id_ownerId.id &&
            row.ownerId === where.id_ownerId.ownerId,
        );
        if (!taskRow) throw new Error("task not found");
        taskRow.projectId = data.project.connect?.id_ownerId.id ?? null;
        return taskRow;
      },
    },
    weeklyReview: {},
  } as unknown as TenantDb;

  return { db, projects, tasks };
}

test("user A cannot read user B rows by ID", async () => {
  const { db } = createTwoUserDatabase();

  assert.equal(await findTaskForOwner(db, "user-a", "task-b"), null);
  assert.equal(await findProjectForOwner(db, "user-a", "project-b"), null);
});

test("user A cannot mutate or delete user B rows", async () => {
  const { db, projects, tasks } = createTwoUserDatabase();

  assert.equal(
    await updateTaskForOwner(db, "user-a", "task-b", { title: "Intrusión" }),
    false,
  );
  assert.equal(await deleteTaskForOwner(db, "user-a", "task-b"), false);
  assert.equal(await archiveProjectForOwner(db, "user-a", "project-b"), false);
  assert.equal(tasks.find((task) => task.id === "task-b")?.title, "Privada B");
  assert.equal(projects.find((project) => project.id === "project-b")?.archived, false);
});

test("user A cannot attach a task to user B's project", async () => {
  const { db, tasks } = createTwoUserDatabase();

  assert.equal(
    await setTaskProjectForOwner(db, "user-a", "task-a", "project-b"),
    false,
  );
  assert.equal(tasks.find((task) => task.id === "task-a")?.projectId, "project-a");
});
