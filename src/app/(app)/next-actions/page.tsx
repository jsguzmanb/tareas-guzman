import { prisma } from "@/lib/prisma";
import { NEXT_ACTION_LIMIT } from "@/lib/constants";
import { getTaskAgeInDays } from "@/lib/task-age";
import NextActionItem from "@/components/NextActionItem";
import { requireActiveUser } from "@/lib/dal";

export default async function NextActionsPage() {
  const user = await requireActiveUser();
  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: { ownerId: user.id, status: "NEXT_ACTION" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { ownerId: user.id, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="jsg-kicker">Tu lista corta</p>
          <h1 className="jsg-page-title mt-2">Siguientes acciones</h1>
          <p className="jsg-muted mt-2 text-sm">Solo lo que puede avanzar ahora.</p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${
            tasks.length >= NEXT_ACTION_LIMIT ? "bg-red-100 text-red-700" : "bg-[var(--sage)] text-[var(--forest)]"
          }`}
        >
          {tasks.length} / {NEXT_ACTION_LIMIT}
        </span>
      </header>
      <ul className="flex flex-col gap-3">
        {tasks.length === 0 && (
          <li className="jsg-card p-8 text-center text-sm jsg-muted">No hay acciones activas. Ve al Inbox y elige una.</li>
        )}
        {tasks.map((task) => (
          <NextActionItem
            key={task.id}
            task={{
              id: task.id,
              title: task.title,
              context: task.context,
              projectId: task.projectId,
              ageInDays: getTaskAgeInDays(task.createdAt),
              tentativeDate: task.tentativeDate?.toISOString() ?? null,
            }}
            projects={projects}
          />
        ))}
      </ul>
    </div>
  );
}
