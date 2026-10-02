import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CreateProjectForm from "@/components/CreateProjectForm";
import ArchiveProjectButton from "@/components/ArchiveProjectButton";
import { requireActiveUser } from "@/lib/dal";

export default async function ProjectsPage() {
  const user = await requireActiveUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        where: { ownerId: user.id, status: { not: "DONE" } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="jsg-kicker">Resultados en movimiento</p>
        <div>
          <h1 className="jsg-page-title">Proyectos</h1>
          <p className="jsg-muted mt-2 text-sm">Agrupa el trabajo que necesita más de un paso.</p>
        </div>
        <CreateProjectForm />
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.length === 0 && (
          <li className="jsg-card col-span-full p-8 text-center text-sm jsg-muted">Aún no tienes proyectos.</li>
        )}
        {projects.map((project) => (
          <li
            key={project.id}
            className="jsg-card flex min-h-28 items-start justify-between gap-3 p-5"
          >
            <Link href={`/projects/${project.id}`} className="font-extrabold text-[var(--forest)] hover:underline">
              <span className="block">{project.name}</span>
              <span className="jsg-muted mt-2 block text-xs font-semibold">
                {project.tasks.length} tarea{project.tasks.length === 1 ? "" : "s"} abierta{project.tasks.length === 1 ? "" : "s"}
              </span>
            </Link>
            <ArchiveProjectButton projectId={project.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
