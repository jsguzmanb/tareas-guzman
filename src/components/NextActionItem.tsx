"use client";

import { useState, useTransition } from "react";
import {
  completeTask,
  sendToSomeday,
  sendToInbox,
  deleteTask,
  updateTaskProject,
  updateTaskContext,
  updateTaskTentativeDate,
} from "@/lib/actions";

type Project = { id: string; name: string };

function ageBadge(days: number) {
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
    ageInDays: number;
    tentativeDate: string | null;
  };
  projects: Project[];
}) {
  const [context, setContext] = useState(task.context ?? "");
  const [tentativeDate, setTentativeDate] = useState(
    task.tentativeDate ? task.tentativeDate.slice(0, 10) : ""
  );
  const [isPending, startTransition] = useTransition();
  const { label, color } = ageBadge(task.ageInDays);

  return (
    <li className="jsg-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-bold text-[var(--forest)]">{task.title}</span>
          <span className={`text-xs ${color}`}>{label}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => startTransition(() => completeTask(task.id))}
            disabled={isPending}
            className="jsg-button-primary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Hecho
          </button>
          <button
            onClick={() => startTransition(() => sendToSomeday(task.id))}
            disabled={isPending}
            className="jsg-button-secondary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Someday
          </button>
          <button
            onClick={() => startTransition(() => sendToInbox(task.id))}
            disabled={isPending}
            className="jsg-button-secondary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Inbox
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
      <div className="grid gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
        <select
          value={task.projectId ?? ""}
          onChange={(e) =>
            startTransition(() => updateTaskProject(task.id, e.target.value || null))
          }
          className="jsg-field min-w-0 px-2 py-1 text-xs"
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
          className="jsg-field min-w-0 px-2 py-1 text-xs"
        />
        <input
          type="date"
          value={tentativeDate}
          onChange={(e) => {
            setTentativeDate(e.target.value);
            startTransition(() => updateTaskTentativeDate(task.id, e.target.value));
          }}
          title="Fecha tentativa (opcional, solo informativa)"
          className="jsg-field min-w-0 px-2 py-1 text-xs"
        />
      </div>
    </li>
  );
}
