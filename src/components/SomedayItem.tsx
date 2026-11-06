"use client";

import { useState, useTransition } from "react";
import { promoteToNextAction, deleteTask } from "@/lib/actions";

export default function SomedayItem({ task }: { task: { id: string; title: string } }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="jsg-card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[var(--forest)]">{task.title}</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() =>
              startTransition(async () => {
                const res = await promoteToNextAction(task.id);
                setError(res?.error ?? null);
              })
            }
            disabled={isPending}
            className="jsg-button-primary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Activar como Next Action
          </button>
          <button
            onClick={() => startTransition(() => deleteTask(task.id))}
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
