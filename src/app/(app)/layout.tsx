import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";
import { getCompletionStreak } from "@/lib/streak";
import { requireActiveUser } from "@/lib/dal";

const NAV = [
  { href: "/", label: "Inbox" },
  { href: "/focus", label: "Ahora" },
  { href: "/next-actions", label: "Next Actions" },
  { href: "/projects", label: "Proyectos" },
  { href: "/someday", label: "Someday" },
  { href: "/review", label: "Revisión" },
  { href: "/settings", label: "Configuración" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveUser();
  const [inboxCount, streak] = await Promise.all([
    prisma.task.count({ where: { ownerId: user.id, status: "INBOX" } }),
    getCompletionStreak(user.id),
  ]);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm px-3 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            {streak > 0 && (
              <span className="text-sm text-amber-600 whitespace-nowrap">
                🔥 {streak} {streak === 1 ? "día" : "días"}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      {inboxCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              Limpia tu Inbox: tienes {inboxCount} {inboxCount === 1 ? "cosa" : "cosas"} sin procesar.
            </p>
            <Link
              href="/"
              className="text-xs shrink-0 px-3 py-1.5 rounded-lg bg-amber-900 text-white hover:bg-amber-800 whitespace-nowrap"
            >
              Procesar bandeja
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
