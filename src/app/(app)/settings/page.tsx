import NotificationSettings from "@/components/NotificationSettings";
import ShortcutCredentials from "@/components/ShortcutCredentials";
import { requireActiveUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireActiveUser();
  const [preference, credentials] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    prisma.shortcutCredential.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const fallbackEmail = user.identityEmail ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500">Tu cuenta, recordatorios y accesos personales.</p>
      </div>

      <NotificationSettings
        preference={{
          notificationEmail: preference?.notificationEmail ?? fallbackEmail,
          timeZone: preference?.timeZone ?? "UTC",
          dailyReminderEnabled: preference?.dailyReminderEnabled ?? true,
          dailyReminderHour: preference?.dailyReminderHour ?? 8,
          weeklyReminderEnabled: preference?.weeklyReminderEnabled ?? true,
          weeklyReminderWeekday: preference?.weeklyReminderWeekday ?? 5,
          weeklyReminderHour: preference?.weeklyReminderHour ?? 9,
        }}
      />

      <hr className="border-neutral-200" />

      <ShortcutCredentials
        credentials={credentials.map((credential) => ({
          id: credential.id,
          label: credential.label,
          tokenPrefix: credential.tokenPrefix,
          createdAt: credential.createdAt.toLocaleDateString("es-MX"),
          lastUsedAt: credential.lastUsedAt?.toLocaleDateString("es-MX") ?? null,
        }))}
      />
    </div>
  );
}
