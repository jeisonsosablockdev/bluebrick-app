"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminShellProps = {
  walletLabel: string;
  children: ReactNode;
};

type AdminNavItem = {
  label: string;
  route: string;
  icon: string;
  isEnabled: boolean;
  badgeCount?: number;
};

type AdminNavSection = {
  section: string;
  items: AdminNavItem[];
};

const ADMIN_NAV: AdminNavSection[] = [
  {
    section: "General",
    items: [
      { label: "Overview", route: "/admin/dashboard", icon: "OV", isEnabled: true },
      { label: "Activos", route: "/admin/assets", icon: "AS", isEnabled: true, badgeCount: 2 },
      { label: "Crear activo", route: "/admin/assets/new", icon: "CR", isEnabled: true }
    ]
  },
  {
    section: "Operacion",
    items: [
      { label: "Mint", route: "/admin/mint", icon: "MI", isEnabled: true },
      { label: "Colecciones", route: "/admin/collections", icon: "CO", isEnabled: true },
      { label: "Ventas", route: "/admin/sales", icon: "VE", isEnabled: true },
      { label: "Tesoreria", route: "/admin/treasury", icon: "TE", isEnabled: true },
      { label: "Distribucion", route: "/admin/distributions", icon: "DI", isEnabled: true },
      { label: "Monitoreo", route: "/admin/monitoring", icon: "MO", isEnabled: true, badgeCount: 3 }
    ]
  },
  {
    section: "Sistema",
    items: [{ label: "Configuracion", route: "/admin/settings", icon: "CF", isEnabled: true }]
  }
];

function isItemActive(pathname: string, route: string): boolean {
  if (pathname === route) {
    return true;
  }

  return pathname.startsWith(`${route}/`);
}

function resolveCurrentLabel(pathname: string): string {
  const enabledItems = ADMIN_NAV.flatMap((section) => section.items.filter((item) => item.isEnabled));
  const found = enabledItems.find((item) => isItemActive(pathname, item.route));
  return found?.label ?? "Overview";
}

export function AdminShell({ walletLabel, children }: AdminShellProps): ReactElement {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const currentLabel = useMemo(() => resolveCurrentLabel(pathname), [pathname]);

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[270px,1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <Card className="sticky top-6 h-[calc(100vh-3rem)] space-y-4 overflow-y-auto p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Admin Console</p>
              <p className="mt-1 text-xs text-white/70">{walletLabel}</p>
            </div>

            {ADMIN_NAV.map((section) => (
              <div key={section.section} className="space-y-2">
                <p className="px-2 text-xs uppercase tracking-[0.15em] text-white/40">{section.section}</p>
                <nav className="space-y-1">
                  {section.items
                    .filter((item) => item.isEnabled)
                    .map((item) => {
                      const active = isItemActive(pathname, item.route);
                      return (
                        <Link
                          key={item.route}
                          href={item.route}
                          className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm ${
                            active ? "bg-cyan-500/20 text-cyan-200" : "text-white/75 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{item.icon}</span>
                            {item.label}
                          </span>
                          {item.badgeCount ? (
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200">{item.badgeCount}</span>
                          ) : null}
                        </Link>
                      );
                    })}
                </nav>
              </div>
            ))}
          </Card>
        </aside>

        <section className="space-y-5">
          <header className="space-y-3 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                aria-label="Abrir menu admin"
                className="min-h-11 min-w-11 px-0 lg:hidden"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                Menu
              </Button>
              <div className="ml-auto rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80">{walletLabel}</div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-white/60">
              <span className="text-white/80">Admin</span>
              <span className="px-1">/</span>
              <span>{currentLabel}</span>
            </nav>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Operacion administrativa</p>
              <h1 className="text-2xl font-semibold text-white">{currentLabel}</h1>
            </div>
          </header>

          {children}
        </section>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Cerrar menu admin" className="absolute inset-0 bg-black/70" onClick={() => setIsDrawerOpen(false)} type="button" />
          <aside className="relative h-full w-[88%] max-w-sm overflow-y-auto border-r border-white/10 bg-[#070b14] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Admin Console</p>
              <Button className="min-h-11" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cerrar
              </Button>
            </div>

            {ADMIN_NAV.map((section) => (
              <div key={`mobile-${section.section}`} className="mb-4 space-y-2">
                <p className="px-2 text-xs uppercase tracking-[0.15em] text-white/40">{section.section}</p>
                <nav className="space-y-1">
                  {section.items
                    .filter((item) => item.isEnabled)
                    .map((item) => {
                      const active = isItemActive(pathname, item.route);
                      return (
                        <Link
                          key={`mobile-${item.route}`}
                          href={item.route}
                          className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm ${
                            active ? "bg-cyan-500/20 text-cyan-200" : "text-white/75 hover:bg-white/5 hover:text-white"
                          }`}
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          <span className="flex items-center gap-2">
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{item.icon}</span>
                            {item.label}
                          </span>
                          {item.badgeCount ? (
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200">{item.badgeCount}</span>
                          ) : null}
                        </Link>
                      );
                    })}
                </nav>
              </div>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}
