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
      className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
        isActive ? "dashboard-sidebar-link-active" : "dashboard-sidebar-link"
      }`}
      href={item.route}
      onClick={onNavigate}
      title={item.label}
    >
      <span className="block w-full truncate">{item.label}</span>
      {item.badgeCount ? (
        <span className="ml-2 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white">
          {item.badgeCount}
        </span>
      ) : null}
    </Link>
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
  const allItems = sections.flatMap((section) => section.items);

  return (
    <nav className="space-y-1">
      {allItems.map((item) => (
        <AdminNavigationLink
          key={`${sectionKeyPrefix ?? "nav"}-${item.route}`}
          item={item}
          onNavigate={onNavigate}
          pathname={pathname}
        />
      ))}
    </nav>
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
