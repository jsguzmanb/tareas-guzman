import { prisma } from "@/lib/prisma";
import { getCompletionStreak } from "@/lib/streak";
import { requireActiveUser } from "@/lib/dal";
import AppNavigation from "@/components/AppNavigation";
import { syncWeeklyRoutinesForOwner } from "@/lib/routines";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveUser();
  await syncWeeklyRoutinesForOwner(prisma, user.id);
  const [inboxCount, streak] = await Promise.all([
    prisma.task.count({ where: { ownerId: user.id, status: "INBOX" } }),
    getCompletionStreak(user.id),
  ]);

  return (
    <div className="jsg-app-shell">
      <AppNavigation streak={streak} />
      <div className="jsg-workspace">
        {inboxCount > 0 && (
          <div className="jsg-inbox-notice">
            <span>{inboxCount}</span>
            <p>Limpia tu Inbox: tienes {inboxCount === 1 ? "una cosa" : `${inboxCount} cosas`} sin procesar.</p>
          </div>
        )}
        <main className="jsg-main">{children}</main>
      </div>
    </div>
  );
}
