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
      <div className="jsg-muted text-sm">
        {lastReviewAt
          ? `Última revisión completada: ${lastReviewAt}`
          : "Todavía no has completado una revisión semanal."}
      </div>

      <ul className="flex flex-col gap-3">
        {steps.map((step) => (
          <li
            key={step.key}
            className="jsg-card flex items-start gap-4 p-4 sm:p-5"
          >
            <input
              type="checkbox"
              checked={!!checked[step.key]}
              onChange={() => toggle(step.key)}
              className="mt-1 h-5 w-5 accent-[var(--forest)]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[var(--forest)]">{step.title}</span>
                {step.done && (
                  <span className="rounded-full bg-[var(--sage)] px-2 py-0.5 text-xs font-bold text-[var(--forest)]">
                    listo
                  </span>
                )}
              </div>
              <p className="jsg-muted mt-1 text-sm">{step.description}</p>
              <Link href={step.href} className="mt-2 inline-block text-sm font-bold text-[var(--forest)] underline">
                {step.linkLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={complete}
        disabled={!allChecked || isPending}
        className="jsg-button-primary self-start px-5 py-3 disabled:opacity-40"
      >
        Marcar revisión semanal como completa
      </button>
    </div>
  );
}
