"use client";

import { useTransition } from "react";
import { completeTask, sendToSomeday } from "@/lib/actions";

export default function FocusTask({
  task,
}: {
  task: { id: string; title: string; context: string | null };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-4 max-w-md text-center">
      <p className="text-xs uppercase tracking-wide text-neutral-400">
        Tu próxima acción
      </p>
      <h1 className="text-2xl font-semibold text-neutral-900">{task.title}</h1>
      {task.context && <p className="text-sm text-neutral-500">{task.context}</p>}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => startTransition(() => completeTask(task.id))}
          disabled={isPending}
          className="px-5 py-2 rounded-lg bg-green-700 text-white font-medium disabled:opacity-50"
        >
          Hecho
        </button>
        <button
          onClick={() => startTransition(() => sendToSomeday(task.id))}
          disabled={isPending}
          className="px-5 py-2 rounded-lg border border-neutral-300 text-neutral-600 disabled:opacity-50"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
