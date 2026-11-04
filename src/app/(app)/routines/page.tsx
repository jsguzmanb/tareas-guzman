import RoutineManager from "@/components/RoutineManager";
import { requireActiveUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function RoutinesPage() {
  const user = await requireActiveUser();
  const routines = await prisma.routine.findMany({
    where: { ownerId: user.id },
    orderBy: [{ pausedAt: "asc" }, { weekday: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, weekday: true, pausedAt: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Rutinas</h1>
        <p className="text-sm text-neutral-500">
          Cada semana, en el día elegido, una tarea aparecerá en tu Inbox. Si la anterior sigue abierta, no se duplicará.
        </p>
      </div>
      <RoutineManager
        routines={routines.map((routine) => ({
          ...routine,
          pausedAt: routine.pausedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
