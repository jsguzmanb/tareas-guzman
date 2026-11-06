"use client";

import { useState, useTransition } from "react";
import {
  completeTask,
  promoteToNextAction,
  sendToSomeday,
  deleteTask,
} from "@/lib/actions";

export default function InboxItem({ task }: { task: { id: string; title: string } }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePromote() {
    startTransition(async () => {
      const res = await promoteToNextAction(task.id);
      setError(res?.error ?? null);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeTask(task.id);
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
    <li className="jsg-card flex flex-col gap-3 p-4">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <span className="font-bold text-[var(--forest)]">{task.title}</span>
        <div className="flex flex-wrap gap-1 sm:shrink-0">
          <button
            onClick={handleComplete}
            disabled={isPending}
            title="Completar ahora (regla de los 2 minutos)"
            className="jsg-button-primary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Completar
          </button>
          <button
            onClick={handlePromote}
            disabled={isPending}
            className="rounded-lg bg-[var(--apricot)] px-3 py-1.5 text-xs font-bold text-[var(--forest)] disabled:opacity-50"
          >
            Next Action
          </button>
          <button
            onClick={handleSomeday}
            disabled={isPending}
            className="jsg-button-secondary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Someday
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
