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
      <header>
        <p className="jsg-kicker">Tu forma de trabajar</p>
        <h1 className="jsg-page-title mt-2">Ajustes</h1>
        <p className="jsg-muted mt-2 text-sm">Tu cuenta, recordatorios y accesos personales.</p>
      </header>

      <div className="jsg-card p-5 sm:p-7"><NotificationSettings preference={{
          notificationEmail: preference?.notificationEmail ?? fallbackEmail,
          timeZone: preference?.timeZone ?? "UTC",
          dailyReminderEnabled: preference?.dailyReminderEnabled ?? true,
          dailyReminderHour: preference?.dailyReminderHour ?? 8,
          weeklyReminderEnabled: preference?.weeklyReminderEnabled ?? true,
          weeklyReminderWeekday: preference?.weeklyReminderWeekday ?? 5,
          weeklyReminderHour: preference?.weeklyReminderHour ?? 9,
        }} /></div>

      <div className="jsg-card p-5 sm:p-7"><ShortcutCredentials
        credentials={credentials.map((credential) => ({
          id: credential.id,
          label: credential.label,
          tokenPrefix: credential.tokenPrefix,
          createdAt: credential.createdAt.toLocaleDateString("es-MX"),
          lastUsedAt: credential.lastUsedAt?.toLocaleDateString("es-MX") ?? null,
        }))}
      /></div>
    </div>
  );
}
