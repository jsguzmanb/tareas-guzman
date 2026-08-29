import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FocusTask from "@/components/FocusTask";

export default async function FocusPage() {
  const task = await prisma.task.findFirst({
    where: { status: "NEXT_ACTION" },
    orderBy: { createdAt: "asc" },
  });

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-lg text-neutral-700">No hay next actions activas.</p>
        <p className="text-sm text-neutral-500">
          Ve al{" "}
          <Link href="/" className="underline">
            Inbox
          </Link>{" "}
          y promueve algo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <FocusTask
        task={{ id: task.id, title: task.title, context: task.context }}
      />
      <Link href="/next-actions" className="text-xs text-neutral-400 underline">
        Ver todas las next actions
      </Link>
    </div>
  );
}
