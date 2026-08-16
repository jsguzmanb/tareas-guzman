import { prisma } from "@/lib/prisma";
import InboxCapture from "@/components/InboxCapture";
import InboxItem from "@/components/InboxItem";

export default async function InboxPage() {
  const tasks = await prisma.task.findMany({
    where: { status: "INBOX" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Inbox</h1>
        <InboxCapture />
      </div>
      <ul className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="text-sm text-neutral-500">Bandeja vacía. Así se siente bien.</p>
        )}
        {tasks.map((task) => (
          <InboxItem key={task.id} task={{ id: task.id, title: task.title }} />
        ))}
      </ul>
    </div>
  );
}
