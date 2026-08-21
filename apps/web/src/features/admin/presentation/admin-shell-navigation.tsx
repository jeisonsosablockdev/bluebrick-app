import Link from "next/link";
import type { ReactElement } from "react";

import type { LocaleText } from "@/lib/i18n";
import { areDevOnlyModulesVisible } from "@/lib/release-module-visibility";

type AdminNavigationItemDefinition = {
  label: LocaleText;
  route: string;
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
      { label: { en: "Overview", es: "Resumen", pt: "Resumo" }, route: "/admin/dashboard" },
      { label: { en: "Assets", es: "Activos", pt: "Ativos" }, route: "/admin/assets", badgeCount: 2 },
      { label: { en: "Create asset", es: "Crear activo", pt: "Criar ativo" }, route: "/admin/assets/new" }
    ]
  },
  {
    section: { en: "Operations", es: "Operaciones", pt: "Operacoes" },
    items: [
      { label: { en: "Mint", es: "Mint", pt: "Mint" }, route: "/admin/mint", releaseControlled: true },
      { label: { en: "Compliance", es: "Cumplimiento", pt: "Compliance" }, route: "/admin/compliance" },
      { label: { en: "Collections", es: "Colecciones", pt: "Colecoes" }, route: "/admin/collections" },
      { label: { en: "Collections health", es: "Salud de colecciones", pt: "Saude de colecoes" }, route: "/admin/health/collections" },
      { label: { en: "Sales", es: "Ventas", pt: "Vendas" }, route: "/admin/sales" },
      { label: { en: "Notifications", es: "Notificaciones", pt: "Notificacoes" }, route: "/admin/notifications" },
      { label: { en: "Treasury", es: "Tesoreria", pt: "Tesouraria" }, route: "/admin/treasury", releaseControlled: true },
      { label: { en: "Distribution", es: "Distribucion", pt: "Distribuicao" }, route: "/admin/distributions" },
      { label: { en: "Monitoring", es: "Monitoreo", pt: "Monitoramento" }, route: "/admin/monitoring", badgeCount: 3 }
    ]
  },
  {
    section: { en: "System", es: "Sistema", pt: "Sistema" },
    items: [{ label: { en: "Settings", es: "Configuracion", pt: "Configuracao" }, route: "/admin/settings", releaseControlled: true }]
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
      className={`group flex min-h-9 items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? "bg-white/10 text-white font-semibold shadow-sm"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
      href={item.route}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isActive ? "bg-cyan-400" : "bg-slate-600 group-hover:bg-slate-400"
          }`}
        />
        <span className="truncate">{item.label}</span>
      </div>
      {item.badgeCount ? (
        <span className="rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
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
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
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
