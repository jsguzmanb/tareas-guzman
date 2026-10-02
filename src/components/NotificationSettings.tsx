"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreference } from "@/lib/settings-actions";

type Preference = {
  notificationEmail: string;
  timeZone: string;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  weeklyReminderEnabled: boolean;
  weeklyReminderWeekday: number;
  weeklyReminderHour: number;
};

export default function NotificationSettings({ preference }: { preference: Preference }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await updateNotificationPreference(formData);
          setMessage(result.error ?? "Preferencias guardadas.");
        })
      }
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-extrabold text-[var(--forest)]">Recordatorios</h2>
        <p className="jsg-muted text-sm">Las horas se interpretan en tu zona horaria.</p>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Correo de notificación</span>
        <input
          type="email"
          name="notificationEmail"
          defaultValue={preference.notificationEmail}
          required
          className="jsg-field w-full px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Zona horaria IANA</span>
        <input
          name="timeZone"
          defaultValue={preference.timeZone}
          required
          className="jsg-field w-full px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="dailyReminderEnabled"
            defaultChecked={preference.dailyReminderEnabled}
          />
          Recordatorio diario
        </label>
        <label className="text-sm">
          Hora diaria
          <input
            type="number"
            name="dailyReminderHour"
            min="0"
            max="23"
            defaultValue={preference.dailyReminderHour}
            className="jsg-field ml-2 w-20 px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="weeklyReminderEnabled"
            defaultChecked={preference.weeklyReminderEnabled}
          />
          Revisión semanal
        </label>
        <div className="flex gap-2">
          <label className="text-sm">
            Día
            <select
              name="weeklyReminderWeekday"
              defaultValue={preference.weeklyReminderWeekday}
              className="jsg-field ml-2 px-2 py-1"
            >
              <option value="1">Lun</option>
              <option value="2">Mar</option>
              <option value="3">Mié</option>
              <option value="4">Jue</option>
              <option value="5">Vie</option>
              <option value="6">Sáb</option>
              <option value="0">Dom</option>
            </select>
          </label>
          <label className="text-sm">
            Hora
            <input
              type="number"
              name="weeklyReminderHour"
              min="0"
              max="23"
              defaultValue={preference.weeklyReminderHour}
              className="jsg-field ml-2 w-20 px-2 py-1"
            />
          </label>
        </div>
      </div>
      {message && <p className="rounded-xl bg-[var(--sage-soft)] p-3 text-sm text-[var(--forest)]">{message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="jsg-button-primary px-5 py-2.5 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar preferencias"}
      </button>
    </form>
  );
}
