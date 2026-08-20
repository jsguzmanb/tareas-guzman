import { prisma } from "@/lib/prisma";
import { NEXT_ACTION_LIMIT } from "@/lib/constants";
import NextActionItem from "@/components/NextActionItem";

export default async function NextActionsPage() {
  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: { status: "NEXT_ACTION" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Next Actions</h1>
        <span
          className={`text-sm font-medium ${
            tasks.length >= NEXT_ACTION_LIMIT ? "text-red-600" : "text-neutral-500"
          }`}
        >
          {tasks.length} / {NEXT_ACTION_LIMIT}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="text-sm text-neutral-500">
            No hay next actions activas. Ve al Inbox y promueve algo.
          </p>
        )}
        {tasks.map((task) => (
          <NextActionItem
            key={task.id}
            task={{
              id: task.id,
              title: task.title,
              context: task.context,
              projectId: task.projectId,
              createdAt: task.createdAt,
              tentativeDate: task.tentativeDate,
            }}
            projects={projects}
          />
        ))}
      </ul>
    </div>
  );
}
