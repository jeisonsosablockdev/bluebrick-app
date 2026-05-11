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
      { label: { en: "Overview", es: "Resumen", pt: "Resumo" }, route: "/admin/dashboard", icon: "OV" },
      { label: { en: "Assets", es: "Activos", pt: "Ativos" }, route: "/admin/assets", icon: "AS", badgeCount: 2 },
      { label: { en: "Create asset", es: "Crear activo", pt: "Criar ativo" }, route: "/admin/assets/new", icon: "CR" }
    ]
  },
  {
    section: { en: "Operations", es: "Operacion", pt: "Operacao" },
    items: [
      { label: { en: "Mint", es: "Mint", pt: "Mint" }, route: "/admin/mint", icon: "MI", releaseControlled: true },
      { label: { en: "Compliance", es: "Cumplimiento", pt: "Compliance" }, route: "/admin/compliance", icon: "CP" },
      { label: { en: "Collections", es: "Colecciones", pt: "Colecoes" }, route: "/admin/collections", icon: "CO" },
      { label: { en: "Collections health", es: "Salud de colecciones", pt: "Saude de colecoes" }, route: "/admin/health/collections", icon: "HL" },
      { label: { en: "Sales", es: "Ventas", pt: "Vendas" }, route: "/admin/sales", icon: "VE" },
      { label: { en: "Treasury", es: "Tesoreria", pt: "Tesouraria" }, route: "/admin/treasury", icon: "TE", releaseControlled: true },
      { label: { en: "Distribution", es: "Distribucion", pt: "Distribuicao" }, route: "/admin/distributions", icon: "DI", releaseControlled: true },
      { label: { en: "Monitoring", es: "Monitoreo", pt: "Monitoramento" }, route: "/admin/monitoring", icon: "MO", badgeCount: 3 }
    ]
  },
  {
    section: { en: "System", es: "Sistema", pt: "Sistema" },
    items: [{ label: { en: "Settings", es: "Configuracion", pt: "Configuracao" }, route: "/admin/settings", icon: "CF", releaseControlled: true }]
  }
];

function AdminNavigationLink({
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
      className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm ${
        isActive ? "admin-sidebar-link-active" : "admin-sidebar-link"
      }`}
      href={item.route}
      onClick={onNavigate}
    >
      <span className="flex items-center gap-2">
        <span className="admin-sidebar-icon rounded-md px-1.5 py-0.5 text-[10px]">{item.icon}</span>
        {item.label}
      </span>
      {item.badgeCount ? (
        <span className="admin-sidebar-badge rounded-full px-2 py-0.5 text-xs">{item.badgeCount}</span>
      ) : null}
    </Link>
  );
}

function AdminNavigationSectionBlock({
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
    <div className="space-y-2">
      <p className="admin-sidebar-section px-2 text-xs uppercase tracking-[0.15em]">{section.section}</p>
      <nav className="space-y-1">
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

export function isAdminRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) {
    return true;
  }

  return pathname.startsWith(`${route}/`);
}

export function buildAdminNavigation(
  localizeText: (text: LocaleText) => string
): AdminNavigationSection[] {
  const showDevOnlyModules = areDevOnlyModulesVisible();

  return ADMIN_NAVIGATION_DEFINITIONS.map((section) => ({
    section: localizeText(section.section),
    items: section.items
      .filter((item) => showDevOnlyModules || !item.releaseControlled)
      .map((item) => ({
        label: localizeText(item.label),
        route: item.route,
        icon: item.icon,
        badgeCount: item.badgeCount
      }))
  })).filter((section) => section.items.length > 0);
}

export function resolveCurrentAdminLabel(pathname: string, navigation: AdminNavigationSection[]): string {
  for (const section of navigation) {
    const currentItem = section.items.find((item) => isAdminRouteActive(pathname, item.route));

    if (currentItem) {
      return currentItem.label;
    }
  }

  return navigation[0]?.items[0]?.label ?? "Overview";
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
    <>
      {sections.map((section) => (
        <AdminNavigationSectionBlock
          key={`${sectionKeyPrefix ?? "nav"}-${section.section}`}
          onNavigate={onNavigate}
          pathname={pathname}
          section={section}
          sectionKeyPrefix={sectionKeyPrefix}
        />
      ))}
    </>
  );
}
