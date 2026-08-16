"use client";

import { useRef, useTransition } from "react";
import { createProject } from "@/lib/actions";

export default function CreateProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await createProject(formData);
          formRef.current?.reset();
        });
      }}
      className="flex gap-2"
    >
      <input
        name="name"
        placeholder="Nombre del proyecto"
        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 bg-white"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
      >
        Crear
      </button>
    </form>
  );
}
