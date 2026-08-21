import Link from "next/link";
import type { ReactElement } from "react";

import type { LocaleText } from "@/lib/i18n";
import { areDevOnlyModulesVisible } from "@/lib/release-module-visibility";

type AdminNavigationItemDefinition = {
  label: LocaleText;
  route: string;
  icon: string;
  badgeCount?: number;
  releaseControlled?: boolean;
};

type AdminNavigationSectionDefinition = {
  section: LocaleText;
  items: AdminNavigationItemDefinition[];
};

export type AdminNavigationItem = {
  label: string;
  route: string;
  icon: string;
  badgeCount?: number;
};

export type AdminNavigationSection = {
  section: string;
  items: AdminNavigationItem[];
};

const ADMIN_NAVIGATION_DEFINITIONS: AdminNavigationSectionDefinition[] = [
  {
    section: { en: "General", es: "General", pt: "Geral" },
    items: [
      { label: { en: "Overview", es: "Resumen", pt: "Resumo" }, route: "/admin/dashboard", icon: "📊" },
      { label: { en: "Assets", es: "Activos", pt: "Ativos" }, route: "/admin/assets", icon: "💎", badgeCount: 2 },
      { label: { en: "Create asset", es: "Crear activo", pt: "Criar ativo" }, route: "/admin/assets/new", icon: "✨" }
    ]
  },
  {
    section: { en: "Operations", es: "Operaciones", pt: "Operacoes" },
    items: [
      { label: { en: "Mint", es: "Mint", pt: "Mint" }, route: "/admin/mint", icon: "⚡", releaseControlled: true },
      { label: { en: "Compliance", es: "Cumplimiento", pt: "Compliance" }, route: "/admin/compliance", icon: "🛡️" },
      { label: { en: "Collections", es: "Colecciones", pt: "Colecoes" }, route: "/admin/collections", icon: "🏢" },
      { label: { en: "Collections health", es: "Salud de colecciones", pt: "Saude de colecoes" }, route: "/admin/health/collections", icon: "🩺" },
      { label: { en: "Sales", es: "Ventas", pt: "Vendas" }, route: "/admin/sales", icon: "📈" },
      { label: { en: "Notifications", es: "Notificaciones", pt: "Notificacoes" }, route: "/admin/notifications", icon: "🔔" },
      { label: { en: "Treasury", es: "Tesoreria", pt: "Tesouraria" }, route: "/admin/treasury", icon: "🏛️", releaseControlled: true },
      { label: { en: "Distribution", es: "Distribucion", pt: "Distribuicao" }, route: "/admin/distributions", icon: "💸" },
      { label: { en: "Monitoring", es: "Monitoreo", pt: "Monitoramento" }, route: "/admin/monitoring", icon: "📡", badgeCount: 3 }
    ]
  },
  {
    section: { en: "System", es: "Sistema", pt: "Sistema" },
    items: [{ label: { en: "Settings", es: "Configuracion", pt: "Configuracao" }, route: "/admin/settings", icon: "⚙️", releaseControlled: true }]
  }
];

export function AdminNavigationLink({
  item,
  pathname,
  onNavigate
}: {
  item: AdminNavigationItem;
  pathname: string;
  onNavigate?: () => void;
}): ReactElement {
  const isActive = isAdminRouteActive(pathname, item.route);

  return (
    <Link
      className={`group flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
        isActive
          ? "border-l-2 border-cyan-400 bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent text-cyan-300 font-semibold shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
      href={item.route}
      onClick={onNavigate}
    >
      <span className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm transition-transform group-hover:scale-110 ${
          isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-slate-400"
        }`}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </span>
      {item.badgeCount ? (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
          {item.badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminNavigationSectionBlock({
  section,
  pathname,
  onNavigate,
  sectionKeyPrefix
}: {
  section: AdminNavigationSection;
  pathname: string;
  onNavigate?: () => void;
  sectionKeyPrefix?: string;
}): ReactElement {
  return (
    <div className="space-y-1.5 py-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {section.section}
      </p>
      <nav className="space-y-0.5">
        {section.items.map((item) => (
          <AdminNavigationLink
            key={`${sectionKeyPrefix ?? "nav"}-${item.route}`}
            item={item}
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ))}
      </nav>
    </div>
  );
}

export function AdminNavigation({
  sections,
  pathname,
  onNavigate,
  sectionKeyPrefix
}: {
  sections: AdminNavigationSection[];
  pathname: string;
  onNavigate?: () => void;
  sectionKeyPrefix?: string;
}): ReactElement {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <AdminNavigationSectionBlock
          key={`${sectionKeyPrefix ?? "nav"}-${section.section}`}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
          sectionKeyPrefix={sectionKeyPrefix}
        />
      ))}
    </div>
  );
}

export function isAdminRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) {
    return true;
  }

  if (route === "/admin/dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }

  return pathname.startsWith(`${route}/`);
}

export function buildAdminNavigation(t: (text: LocaleText) => string): AdminNavigationSection[] {
  const showDevOnly = areDevOnlyModulesVisible();

  return ADMIN_NAVIGATION_DEFINITIONS.map((section) => ({
    section: t(section.section),
    items: section.items
      .filter((item) => !item.releaseControlled || showDevOnly)
      .map((item) => ({
        label: t(item.label),
        route: item.route,
        icon: item.icon,
        badgeCount: item.badgeCount
      }))
  })).filter((section) => section.items.length > 0);
}

export function resolveCurrentAdminLabel(pathname: string, sections: AdminNavigationSection[]): string {
  for (const section of sections) {
    for (const item of section.items) {
      if (isAdminRouteActive(pathname, item.route)) {
        return item.label;
      }
    }
  }

  return sections[0]?.items[0]?.label ?? "Admin";
}
