import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/", label: "Inbox" },
  { href: "/next-actions", label: "Next Actions" },
  { href: "/projects", label: "Proyectos" },
  { href: "/someday", label: "Someday" },
  { href: "/review", label: "Revisión" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
