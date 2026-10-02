import { prisma } from "@/lib/prisma";
import InboxCapture from "@/components/InboxCapture";
import InboxItem from "@/components/InboxItem";
import RefreshOnFocus from "@/components/RefreshOnFocus";
import { requireActiveUser } from "@/lib/dal";

export default async function InboxPage() {
  const user = await requireActiveUser();
  const tasks = await prisma.task.findMany({
    where: { ownerId: user.id, status: "INBOX" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <RefreshOnFocus />
      <header className="space-y-3">
        <p className="jsg-kicker">Captura sin fricción</p>
        <div>
          <h1 className="jsg-page-title">Saca todo de tu cabeza.</h1>
          <p className="jsg-muted mt-2 max-w-xl">Anótalo ahora. Decide qué hacer con ello cuando estés listo.</p>
        </div>
        <InboxCapture />
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--forest)]">Por procesar</h2>
          <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-xs font-bold text-[var(--forest)]">{tasks.length}</span>
        </div>
        <ul className="flex flex-col gap-3">
        {tasks.length === 0 && (
          <li className="jsg-card p-8 text-center">
            <p className="text-lg font-bold text-[var(--forest)]">Bandeja vacía.</p>
            <p className="jsg-muted mt-1 text-sm">Así se siente tener espacio para pensar.</p>
          </li>
        )}
        {tasks.map((task) => (
          <InboxItem key={task.id} task={{ id: task.id, title: task.title }} />
        ))}
        </ul>
      </section>
    </div>
  );
}
