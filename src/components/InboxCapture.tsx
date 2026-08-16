"use client";

import { useRef, useTransition } from "react";
import { createInboxTask } from "@/lib/actions";

export default function InboxCapture({
  projectId,
  placeholder,
}: {
  projectId?: string;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await createInboxTask(formData);
          formRef.current?.reset();
        });
      }}
      className="flex gap-2"
    >
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      <input
        name="title"
        placeholder={placeholder ?? "¿Qué tienes en la cabeza? Escríbelo y ya."}
        autoFocus
        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 bg-white"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
      >
        Capturar
      </button>
    </form>
  );
}
