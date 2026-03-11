"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProtectedShellProps = {
  authenticatedPublicKey: string;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
};

const DASHBOARD_NAV: NavItem[] = [
  {
    href: "/protected",
    label: "Overview",
    title: "Overview",
    description: "Resumen general de cuenta y KPIs principales."
  },
  {
    href: "/protected/portfolio",
    label: "Mi Portfolio",
    title: "Mi Portfolio",
    description: "Consulta tus NFTs, valor y estado de posiciones."
  },
  {
    href: "/protected/stake",
    label: "Stake / Unstake",
    title: "Stake / Unstake",
    description: "Gestiona el estado de staking de tus activos."
  },
  {
    href: "/protected/rentas",
    label: "Rentas / Claim",
    title: "Rentas / Claim",
    description: "Monitorea rentas disponibles y acciones de claim."
  },
  {
    href: "/protected/historial",
    label: "Historial",
    title: "Historial",
    description: "Audita eventos recientes y movimientos de cuenta."
  },
  {
    href: "/protected/perfil",
    label: "Perfil / Soporte",
    title: "Perfil / Soporte",
    description: "Administra configuracion de perfil y canales de soporte."
  }
];

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedShell({ authenticatedPublicKey, children }: ProtectedShellProps): ReactElement {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const currentModule = useMemo<NavItem>(() => {
    const active = DASHBOARD_NAV.find((item) => isActive(pathname, item.href));
    return active ?? DASHBOARD_NAV[0];
  }, [pathname]);

  const wrapperGridClass = isCollapsed ? "lg:grid-cols-[92px,1fr]" : "lg:grid-cols-[260px,1fr]";

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-7xl lg:grid ${wrapperGridClass} lg:gap-6`}>
        <aside className="hidden lg:block">
          <Card className="sticky top-6 h-[calc(100vh-3rem)] space-y-4 p-3">
            <div className="flex items-center justify-between">
              {!isCollapsed && <p className="px-2 text-xs uppercase tracking-[0.2em] text-white/50">Navegacion</p>}
              <Button
                aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                className="min-h-11 min-w-11 px-0"
                variant="ghost"
                onClick={() => setIsCollapsed((previous) => !previous)}
              >
                {isCollapsed ? ">>" : "<<"}
              </Button>
            </div>
            <nav className="space-y-1">
              {DASHBOARD_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                      active ? "bg-cyan-500/20 text-cyan-200" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                    title={item.label}
                  >
                    <span className="block w-full truncate">{isCollapsed ? item.label.slice(0, 2) : item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>

        <section className="space-y-5">
          <header className="space-y-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                aria-label="Abrir menu del dashboard"
                className="min-h-11 min-w-11 px-0 lg:hidden"
                variant="ghost"
                onClick={() => setIsDrawerOpen(true)}
              >
                Menu
              </Button>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-white">{truncatePublicKey(authenticatedPublicKey)}</span>
              </div>
            </div>
            <nav aria-label="breadcrumb" className="text-xs text-white/60">
              <span className="text-white/80">Dashboard</span>
              <span className="px-1">/</span>
              <span>{currentModule.title}</span>
            </nav>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Investor Dashboard</p>
              <h1 className="text-2xl font-semibold text-white">{currentModule.title}</h1>
              <p className="mt-1 text-sm text-white/70">{currentModule.description}</p>
            </div>
          </header>

          {children}
        </section>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsDrawerOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[84%] max-w-xs border-r border-white/10 bg-[#060b16] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Navegacion</p>
              <Button className="min-h-11" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cerrar
              </Button>
            </div>
            <nav className="space-y-1">
              {DASHBOARD_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${
                      active ? "bg-cyan-500/20 text-cyan-200" : "text-white/80 hover:bg-white/5"
                    }`}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </main>
  );
}
