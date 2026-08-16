import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CreateProjectForm from "@/components/CreateProjectForm";
import ArchiveProjectButton from "@/components/ArchiveProjectButton";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        where: { status: { not: "DONE" } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Proyectos</h1>
        <CreateProjectForm />
      </div>
      <ul className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="text-sm text-neutral-500">Aún no tienes proyectos.</p>
        )}
        {projects.map((project) => (
          <li
            key={project.id}
            className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2 bg-white"
          >
            <Link href={`/projects/${project.id}`} className="text-neutral-900 hover:underline">
              {project.name}
              <span className="text-neutral-400 text-sm ml-2">
                ({project.tasks.length} tarea{project.tasks.length === 1 ? "" : "s"})
              </span>
            </Link>
            <ArchiveProjectButton projectId={project.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
