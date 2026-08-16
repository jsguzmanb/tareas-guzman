import { prisma } from "@/lib/prisma";
import SomedayCapture from "@/components/SomedayCapture";
import SomedayItem from "@/components/SomedayItem";

export default async function SomedayPage() {
  const tasks = await prisma.task.findMany({
    where: { status: "SOMEDAY" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Someday / Maybe</h1>
        <SomedayCapture />
      </div>
      <ul className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="text-sm text-neutral-500">Nada guardado para algún día, todavía.</p>
        )}
        {tasks.map((task) => (
          <SomedayItem key={task.id} task={{ id: task.id, title: task.title }} />
        ))}
      </ul>
    </div>
  );
}
