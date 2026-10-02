import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTaskAgeInDays } from "@/lib/task-age";
import InboxCapture from "@/components/InboxCapture";
import InboxItem from "@/components/InboxItem";
import NextActionItem from "@/components/NextActionItem";
import { requireActiveUser } from "@/lib/dal";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireActiveUser();

  const [project, projects] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ownerId: user.id },
      include: {
        tasks: {
          where: { ownerId: user.id },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.project.findMany({
      where: { ownerId: user.id, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!project) notFound();

  const inbox = project.tasks.filter((t) => t.status === "INBOX");
  const nextActions = project.tasks.filter((t) => t.status === "NEXT_ACTION");
  const someday = project.tasks.filter((t) => t.status === "SOMEDAY");
  const done = project.tasks.filter((t) => t.status === "DONE");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="jsg-kicker">Proyecto</p>
        <h1 className="jsg-page-title mt-2">{project.name}</h1>
        <p className="jsg-muted mt-2 text-sm">Todas las piezas de este resultado, en un solo lugar.</p>
      </header>

      <InboxCapture projectId={project.id} placeholder="Agregar tarea a este proyecto..." />

      {nextActions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold text-[var(--forest)]">Siguientes acciones</h2>
          <ul className="flex flex-col gap-3">
            {nextActions.map((task) => (
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
        </section>
      )}

      {inbox.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold text-[var(--forest)]">Sin procesar</h2>
          <ul className="flex flex-col gap-3">
            {inbox.map((task) => (
              <InboxItem key={task.id} task={{ id: task.id, title: task.title }} />
            ))}
          </ul>
        </section>
      )}

      {someday.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold text-[var(--forest)]">Algún día</h2>
          <ul className="flex flex-col gap-3">
            {someday.map((task) => (
              <li
                key={task.id}
                className="jsg-card p-4 text-[var(--forest)]"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold text-[var(--forest)]">Hechas</h2>
          <ul className="flex flex-col gap-3">
            {done.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--sage-soft)] p-4 text-[var(--muted)] line-through"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.tasks.length === 0 && (
        <p className="jsg-card p-8 text-center text-sm jsg-muted">Este proyecto no tiene tareas todavía.</p>
      )}
    </div>
  );
}
