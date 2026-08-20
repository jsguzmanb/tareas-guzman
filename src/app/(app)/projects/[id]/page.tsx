import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InboxCapture from "@/components/InboxCapture";
import InboxItem from "@/components/InboxItem";
import NextActionItem from "@/components/NextActionItem";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, projects] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const inbox = project.tasks.filter((t) => t.status === "INBOX");
  const nextActions = project.tasks.filter((t) => t.status === "NEXT_ACTION");
  const someday = project.tasks.filter((t) => t.status === "SOMEDAY");
  const done = project.tasks.filter((t) => t.status === "DONE");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">{project.name}</h1>

      <InboxCapture projectId={project.id} placeholder="Agregar tarea a este proyecto..." />

      {nextActions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Next Actions</h2>
          <ul className="flex flex-col gap-2">
            {nextActions.map((task) => (
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
        </section>
      )}

      {inbox.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Sin procesar</h2>
          <ul className="flex flex-col gap-2">
            {inbox.map((task) => (
              <InboxItem key={task.id} task={{ id: task.id, title: task.title }} />
            ))}
          </ul>
        </section>
      )}

      {someday.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Someday/Maybe</h2>
          <ul className="flex flex-col gap-2">
            {someday.map((task) => (
              <li
                key={task.id}
                className="border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Hechas</h2>
          <ul className="flex flex-col gap-2">
            {done.map((task) => (
              <li
                key={task.id}
                className="border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-100 text-neutral-400 line-through"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.tasks.length === 0 && (
        <p className="text-sm text-neutral-500">Este proyecto no tiene tareas todavía.</p>
      )}
    </div>
  );
}
