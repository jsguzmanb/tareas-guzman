"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recordWeeklyReviewCompletion } from "@/lib/actions";

type Step = {
  key: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  done: boolean;
};

export default function ReviewChecklist({
  inboxCount,
  projectsCount,
  somedayCount,
  nextActionsCount,
  limit,
  lastReviewAt,
}: {
  inboxCount: number;
  projectsCount: number;
  somedayCount: number;
  nextActionsCount: number;
  limit: number;
  lastReviewAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const steps: Step[] = [
    {
      key: "inbox",
      title: "Vacía el Inbox",
      description:
        inboxCount === 0
          ? "Tu inbox está en cero."
          : `Tienes ${inboxCount} cosa${inboxCount === 1 ? "" : "s"} sin procesar.`,
      href: "/",
      linkLabel: "Ir al Inbox",
      done: inboxCount === 0,
    },
    {
      key: "projects",
      title: "Revisa tus proyectos",
      description: `Tienes ${projectsCount} proyecto${projectsCount === 1 ? "" : "s"} activo${projectsCount === 1 ? "" : "s"}. Confirma que cada uno tenga al menos una next action.`,
      href: "/projects",
      linkLabel: "Ver proyectos",
      done: true,
    },
    {
      key: "someday",
      title: "Revisa Someday/Maybe",
      description: `Tienes ${somedayCount} idea${somedayCount === 1 ? "" : "s"} guardada${somedayCount === 1 ? "" : "s"}. ¿Alguna ya está lista para activarse?`,
      href: "/someday",
      linkLabel: "Ver Someday/Maybe",
      done: true,
    },
    {
      key: "next-actions",
      title: "Rellena tus Next Actions",
      description: `Tienes ${nextActionsCount} / ${limit} next actions activas. Súbelas al límite si tienes espacio.`,
      href: "/next-actions",
      linkLabel: "Ver Next Actions",
      done: nextActionsCount >= limit,
    },
  ];

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = steps.every((s) => checked[s.key]);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function complete() {
    startTransition(async () => {
      await recordWeeklyReviewCompletion();
      router.refresh();
      setChecked({});
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-neutral-500">
        {lastReviewAt
          ? `Última revisión completada: ${lastReviewAt}`
          : "Todavía no has completado una revisión semanal."}
      </div>

      <ul className="flex flex-col gap-3">
        {steps.map((step) => (
          <li
            key={step.key}
            className="flex items-start gap-3 border border-neutral-200 rounded-lg px-3 py-3 bg-white"
          >
            <input
              type="checkbox"
              checked={!!checked[step.key]}
              onChange={() => toggle(step.key)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{step.title}</span>
                {step.done && (
                  <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                    listo
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">{step.description}</p>
              <Link href={step.href} className="text-sm text-neutral-900 underline mt-1 inline-block">
                {step.linkLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={complete}
        disabled={!allChecked || isPending}
        className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-40 self-start"
      >
        Marcar revisión semanal como completa
      </button>
    </div>
  );
}
