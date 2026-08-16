"use client";

import { useState, useTransition } from "react";
import { promoteToNextAction, sendToSomeday, deleteTask } from "@/lib/actions";

export default function InboxItem({ task }: { task: { id: string; title: string } }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePromote() {
    startTransition(async () => {
      const res = await promoteToNextAction(task.id);
      setError(res?.error ?? null);
    });
  }

  function handleSomeday() {
    startTransition(async () => {
      await sendToSomeday(task.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <li className="flex flex-col gap-1 border border-neutral-200 rounded-lg px-3 py-2 bg-white">
      <div className="flex items-center justify-between gap-2">
        <span className="text-neutral-900">{task.title}</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handlePromote}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded bg-neutral-900 text-white disabled:opacity-50"
          >
            Next Action
          </button>
          <button
            onClick={handleSomeday}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border border-neutral-300 disabled:opacity-50"
          >
            Someday
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded text-red-600 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
