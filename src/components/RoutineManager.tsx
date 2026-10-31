"use client";

import { useRef, useState, useTransition } from "react";
import { createWeeklyRoutine, setRoutinePaused } from "@/lib/actions";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Routine = {
  id: string;
  title: string;
  weekday: number;
  pausedAt: string | null;
};

export default function RoutineManager({ routines }: { routines: Routine[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const createFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <form
        ref={createFormRef}
        action={(formData) =>
          startTransition(async () => {
            const result = await createWeeklyRoutine(formData);
            setMessage(result.error ?? "Rutina creada.");
            if (!result.error) createFormRef.current?.reset();
          })
        }
        className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3"
      >
        <h2 className="font-medium text-neutral-900">Nueva rutina semanal</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="title"
            required
            placeholder="Ej.: Planificar la semana"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2"
          />
          <select name="weekday" defaultValue="1" className="rounded border border-neutral-300 px-3 py-2">
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Crear
          </button>
        </div>
        {message && <p className="text-sm text-neutral-600">{message}</p>}
      </form>

      <div className="space-y-2">
        {routines.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no tienes rutinas semanales.</p>
        ) : (
          routines.map((routine) => {
            const isPaused = routine.pausedAt !== null;
            return (
              <div
                key={routine.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-neutral-900">{routine.title}</p>
                  <p className="text-sm text-neutral-500">
                    Cada {WEEKDAYS[routine.weekday]}
                    {isPaused ? " · Pausada" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => setRoutinePaused(routine.id, !isPaused))
                  }
                  className="shrink-0 rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
                >
                  {isPaused ? "Reanudar" : "Pausar"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
