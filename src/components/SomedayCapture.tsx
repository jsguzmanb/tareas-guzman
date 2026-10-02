"use client";

import { useRef, useTransition } from "react";
import { createSomedayTask } from "@/lib/actions";

export default function SomedayCapture() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await createSomedayTask(formData);
          formRef.current?.reset();
        });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        name="title"
        placeholder="Una idea para algún día..."
        className="jsg-field flex-1 px-4 py-2.5"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="jsg-button-primary px-5 py-2.5 disabled:opacity-50"
      >
        Guardar
      </button>
    </form>
  );
}
