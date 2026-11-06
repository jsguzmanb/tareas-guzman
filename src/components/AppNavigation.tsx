"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArchiveBoxIcon,
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  LightBulbIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/", label: "Inbox", icon: InboxIcon },
  { href: "/focus", label: "Ahora", icon: BoltIcon },
  { href: "/next-actions", label: "Siguientes", icon: CheckCircleIcon },
  { href: "/projects", label: "Proyectos", icon: RectangleStackIcon },
  { href: "/someday", label: "Algún día", icon: LightBulbIcon },
  { href: "/review", label: "Revisión", icon: ArchiveBoxIcon },
  { href: "/routines", label: "Rutinas", icon: CalendarDaysIcon },
  { href: "/settings", label: "Ajustes", icon: Cog6ToothIcon },
];

export default function AppNavigation({ streak }: { streak: number }) {
  const pathname = usePathname();

  return (
    <aside className="jsg-sidebar">
      <div className="jsg-brand">
        <Image src="/jsg-mark.png" width={48} height={32} alt="Juan S. Guzmán" priority unoptimized />
        <div>
          <strong>Tareas</strong>
          <span>Menos ruido. Más avance.</span>
        </div>
      </div>

      <nav className="jsg-nav" aria-label="Navegación principal">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? "is-active" : undefined}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="jsg-mobile-logout"><LogoutButton /></div>

      <div className="jsg-sidebar-footer">
        {streak > 0 && (
          <p><span>{streak}</span> {streak === 1 ? "día de avance" : "días de avance"}</p>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}
