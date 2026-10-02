import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FocusTask from "@/components/FocusTask";
import { requireActiveUser } from "@/lib/dal";

export default async function FocusPage() {
  const user = await requireActiveUser();
  const task = await prisma.task.findFirst({
    where: { ownerId: user.id, status: "NEXT_ACTION" },
    orderBy: { createdAt: "asc" },
  });

  if (!task) {
    return (
      <div className="jsg-card flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
        <p className="jsg-kicker">Un momento de calma</p>
        <h1 className="jsg-page-title mt-2">No hay nada urgente.</h1>
        <p className="jsg-muted mt-2 text-sm">Revisa el <Link href="/" className="font-bold underline">Inbox</Link> cuando quieras elegir una nueva acción.</p>
      </div>
    );
  }

  return (
    <div className="jsg-card flex min-h-[62vh] flex-col items-center justify-center gap-6 px-6 py-16">
      <FocusTask
        task={{ id: task.id, title: task.title, context: task.context }}
      />
      <Link href="/next-actions" className="jsg-muted text-xs font-bold underline">
        Ver todas las siguientes acciones
      </Link>
    </div>
  );
}
