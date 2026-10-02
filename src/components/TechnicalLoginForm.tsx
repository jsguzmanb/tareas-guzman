"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function TechnicalLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Error al iniciar sesión");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="technical-username" className="jsg-muted text-sm font-bold">
          Usuario
        </label>
        <input
          id="technical-username"
          className="jsg-field w-full px-3 py-2"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="technical-password" className="jsg-muted text-sm font-bold">
          Contraseña
        </label>
        <input
          id="technical-password"
          type="password"
          className="jsg-field w-full px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="jsg-button-secondary w-full py-2.5 disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar técnicamente"}
      </button>
    </form>
  );
}
