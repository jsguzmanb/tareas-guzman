"use client";

import { useTransition } from "react";
import { archiveProject } from "@/lib/actions";

export default function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => archiveProject(projectId))}
      disabled={isPending}
      className="rounded-lg px-2 py-1 text-xs font-bold text-[var(--muted)] hover:bg-[var(--sage-soft)] disabled:opacity-50"
    >
      Archivar
    </button>
  );
}
