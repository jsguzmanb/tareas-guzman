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
    <div className="flex max-w-xl flex-col items-center gap-4 text-center">
      <p className="jsg-kicker">
        Tu próxima acción
      </p>
      <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[var(--forest)] sm:text-4xl">{task.title}</h1>
      {task.context && <p className="jsg-muted text-sm">{task.context}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => startTransition(() => completeTask(task.id))}
          disabled={isPending}
          className="jsg-button-primary px-6 py-3 disabled:opacity-50"
        >
          Hecho
        </button>
        <button
          onClick={() => startTransition(() => sendToSomeday(task.id))}
          disabled={isPending}
          className="jsg-button-secondary px-6 py-3 disabled:opacity-50"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
