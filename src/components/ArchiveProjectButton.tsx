"use client";

import { useTransition } from "react";
import { archiveProject } from "@/lib/actions";

export default function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => archiveProject(projectId))}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
    >
      Archivar
    </button>
  );
}
