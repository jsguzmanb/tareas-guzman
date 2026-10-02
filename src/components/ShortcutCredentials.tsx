"use client";

import { useState, useTransition } from "react";
import {
  createShortcutCredential,
  regenerateShortcutCredential,
  revokeShortcutCredential,
} from "@/lib/settings-actions";

type Credential = {
  id: string;
  label: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export default function ShortcutCredentials({ credentials }: { credentials: Credential[] }) {
  const [label, setLabel] = useState("Mi iPhone");
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reveal(result: { token: string | null; error: string | null }) {
    setRevealedToken(result.token);
    setError(result.error);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-[var(--forest)]">Atajos de iPhone</h2>
        <p className="jsg-muted text-sm">
          Cada dispositivo usa su propia credencial. El token completo solo se muestra una vez.
        </p>
      </div>

      {revealedToken && (
        <div className="space-y-2 rounded-xl border border-[var(--apricot)] bg-[var(--apricot-soft)] p-4">
          <p className="text-sm font-medium text-amber-900">Guarda este token ahora:</p>
          <input
            readOnly
            value={revealedToken}
            className="w-full rounded border border-amber-300 bg-white px-2 py-1 font-mono text-sm"
            onFocus={(event) => event.currentTarget.select()}
          />
          <p className="text-xs text-amber-800">No podremos volver a mostrarlo.</p>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="jsg-field min-w-0 flex-1 px-3 py-2"
          placeholder="Nombre del dispositivo"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => reveal(await createShortcutCredential(label)))
          }
          className="jsg-button-primary px-4 py-2 disabled:opacity-50"
        >
          Crear
        </button>
      </div>

      <ul className="space-y-2">
        {credentials.map((credential) => (
          <li
            key={credential.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-bold text-[var(--forest)]">{credential.label}</p>
              <p className="jsg-muted text-xs">
                {credential.tokenPrefix} · creada {credential.createdAt}
                {credential.lastUsedAt ? ` · último uso ${credential.lastUsedAt}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () =>
                    reveal(await regenerateShortcutCredential(credential.id)),
                  )
                }
                className="text-xs underline disabled:opacity-50"
              >
                Regenerar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    setRevealedToken(null);
                    await revokeShortcutCredential(credential.id);
                  })
                }
                className="text-xs text-red-700 disabled:opacity-50"
              >
                Revocar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
