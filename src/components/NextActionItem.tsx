"use client";

import { useState, useTransition } from "react";
import {
  completeTask,
  sendToSomeday,
  sendToInbox,
  deleteTask,
  updateTaskProject,
  updateTaskContext,
} from "@/lib/actions";

type Project = { id: string; name: string };

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function ageBadge(createdAt: Date) {
  const days = Math.floor((Date.now() - createdAt.getTime()) / MS_PER_DAY);
  const label = days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
  const color =
    days >= 14 ? "text-red-600" : days >= 7 ? "text-amber-600" : "text-neutral-400";
  return { label, color };
}

export default function NextActionItem({
  task,
  projects,
}: {
  task: {
    id: string;
    title: string;
    context: string | null;
    projectId: string | null;
    createdAt: Date;
  };
  projects: Project[];
}) {
  const [context, setContext] = useState(task.context ?? "");
  const [isPending, startTransition] = useTransition();
  const { label, color } = ageBadge(task.createdAt);

  return (
    <li className="flex flex-col gap-2 border border-neutral-200 rounded-lg px-3 py-2 bg-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-neutral-900">{task.title}</span>
          <span className={`text-xs ${color}`}>{label}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => startTransition(() => completeTask(task.id))}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded bg-green-700 text-white disabled:opacity-50"
          >
            Hecho
          </button>
          <button
            onClick={() => startTransition(() => sendToSomeday(task.id))}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border border-neutral-300 disabled:opacity-50"
          >
            Someday
          </button>
          <button
            onClick={() => startTransition(() => sendToInbox(task.id))}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border border-neutral-300 disabled:opacity-50"
          >
            Inbox
          </button>
          <button
            onClick={() => startTransition(() => deleteTask(task.id))}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded text-red-600 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
      <div className="flex gap-2 text-xs">
        <select
          value={task.projectId ?? ""}
          onChange={(e) =>
            startTransition(() => updateTaskProject(task.id, e.target.value || null))
          }
          className="border border-neutral-200 rounded px-2 py-1 bg-neutral-50 text-neutral-700"
        >
          <option value="">Sin proyecto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onBlur={() => startTransition(() => updateTaskContext(task.id, context))}
          placeholder="contexto (opcional)"
          className="border border-neutral-200 rounded px-2 py-1 bg-neutral-50 text-neutral-700 w-40"
        />
      </div>
    </li>
  );
}
