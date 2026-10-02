import { prisma } from "@/lib/prisma";
import SomedayCapture from "@/components/SomedayCapture";
import SomedayItem from "@/components/SomedayItem";
import { requireActiveUser } from "@/lib/dal";

export default async function SomedayPage() {
  const user = await requireActiveUser();
  const tasks = await prisma.task.findMany({
    where: { ownerId: user.id, status: "SOMEDAY" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="jsg-kicker">Sin perder buenas ideas</p>
        <div>
          <h1 className="jsg-page-title">Algún día</h1>
          <p className="jsg-muted mt-2 text-sm">Guarda posibilidades sin convertirlas en ruido.</p>
        </div>
        <SomedayCapture />
      </header>
      <ul className="flex flex-col gap-3">
        {tasks.length === 0 && (
          <li className="jsg-card p-8 text-center text-sm jsg-muted">Nada guardado para algún día, todavía.</li>
        )}
        {tasks.map((task) => (
          <SomedayItem key={task.id} task={{ id: task.id, title: task.title }} />
        ))}
      </ul>
    </div>
  );
}
