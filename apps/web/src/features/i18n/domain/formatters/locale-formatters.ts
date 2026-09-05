/**
 * @file apps/web/src/features/i18n/domain/formatters/locale-formatters.ts
 * @description Layer 3: Domain - Locale-Aware Number, Currency, Date, and String Interpolation Formatters.
 * Uses standard Intl APIs with fallback resilience.
 */

import { DEFAULT_LOCALE, type SupportedLocale, type FormatOptions } from "../models/locale-types";

/**
 * Maps supported locale codes to full BCP 47 language tags for Intl formatting.
 */
const BCP47_TAGS: Record<SupportedLocale, string> = {
  es: "es-US",
  en: "en-US",
  pt: "pt-BR",
};

/**
 * Format a numeric amount as USD currency according to locale customs.
 * Operates in US Dollars ($ USD) across all supported languages.
 *
 * @param amount - Number value in USD dollars.
 * @param options - Formatting configuration overrides.
 * @returns Formatted currency string (e.g., "$120,000" or "$120,000 USD").
 */
export function formatCurrency(amount: number, options?: FormatOptions & { showCode?: boolean }): string {
  // Step 1: Resolve target locale tag
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-US";

  // Step 2: Format number using Intl.NumberFormat
  try {
    const formatted = new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(amount);

    return options?.showCode ? `${formatted} USD` : formatted;
  } catch {
    // Step 3: Fallback if Intl fails in unexpected environments
    return `$${amount.toLocaleString()}`;
  }
}

/**
 * Format a numeric percentage according to locale conventions.
 *
 * @param value - Percentage value (e.g. 14.5).
 * @param options - Formatting configuration.
 * @returns Formatted percentage string (e.g. "14,5%" or "14.5%").
 */
export function formatPercent(value: number, options?: FormatOptions): string {
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-CO";

  try {
    return new Intl.NumberFormat(tag, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 1,
      maximumFractionDigits: options?.maximumFractionDigits ?? 1,
    }).format(value) + "%";
  } catch {
    return `${value.toFixed(1)}%`;
  }
}

/**
 * Format an integer or float number.
 *
 * @param value - Numerical value.
 * @param options - Formatting options.
 * @returns Formatted number string.
 */
export function formatNumber(value: number, options?: FormatOptions): string {
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-CO";

  try {
    return new Intl.NumberFormat(tag, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Spanish month name replacements across locales.
 */
const MONTH_TRANSLATIONS: Record<string, Record<SupportedLocale, string>> = {
  enero: { es: "Enero", en: "January", pt: "Janeiro" },
  febrero: { es: "Febrero", en: "February", pt: "Fevereiro" },
  marzo: { es: "Marzo", en: "March", pt: "Março" },
  abril: { es: "Abril", en: "April", pt: "Abril" },
  mayo: { es: "Mayo", en: "May", pt: "Maio" },
  junio: { es: "Junio", en: "June", pt: "Junho" },
  julio: { es: "Julio", en: "July", pt: "Julho" },
  agosto: { es: "Agosto", en: "August", pt: "Agosto" },
  septiembre: { es: "Septiembre", en: "September", pt: "Setembro" },
  setiembre: { es: "Septiembre", en: "September", pt: "Setembro" },
  octubre: { es: "Octubre", en: "October", pt: "Outubro" },
  noviembre: { es: "Noviembre", en: "November", pt: "Novembro" },
  diciembre: { es: "Diciembre", en: "December", pt: "Dezembro" },
};

/**
 * Common status and date connector words in timing fields.
 */
const TIMING_KEYWORD_TRANSLATIONS: Record<string, Record<SupportedLocale, string>> = {
  concluida: { es: "Concluida", en: "Completed", pt: "Concluída" },
  concluido: { es: "Concluido", en: "Completed", pt: "Concluído" },
  "en curso": { es: "En curso", en: "In Progress", pt: "Em Andamento" },
  activa: { es: "Activa", en: "Active", pt: "Ativa" },
  activo: { es: "Activo", en: "Active", pt: "Ativo" },
  desde: { es: "desde", en: "from", pt: "a partir de" },
  meses: { es: "meses", en: "months", pt: "meses" },
  mes: { es: "mes", en: "month", pt: "mês" },
  estimada: { es: "Estimada", en: "Estimated", pt: "Estimada" },
  estimado: { es: "Estimado", en: "Estimated", pt: "Estimado" },
};

/**
 * Format a timing string (such as "Noviembre 2026", "Concluida — Junio 2026", or ISO date string)
 * into a localized display date according to active language customs.
 *
 * @param timing - Raw timing or date string.
 * @param options - Locale override options.
 * @returns Localized timing string (e.g. "November 2026" or "Novembro 2026").
 */
export function formatTiming(timing: string | null | undefined, options?: FormatOptions): string {
  if (!timing || typeof timing !== "string") return "";

  const locale = options?.locale || DEFAULT_LOCALE;
  if (locale === "es") return timing;

  let result = timing;

  // Step 1: Translate Spanish month names
  for (const [esMonth, translations] of Object.entries(MONTH_TRANSLATIONS)) {
    const monthRegex = new RegExp(`\\b${esMonth}\\b`, "gi");
    result = result.replace(monthRegex, translations[locale]);
  }

  // Step 2: Translate timing status keywords (e.g. "Concluida", "En curso")
  for (const [esKeyword, translations] of Object.entries(TIMING_KEYWORD_TRANSLATIONS)) {
    const keywordRegex = new RegExp(`\\b${esKeyword}\\b`, "gi");
    result = result.replace(keywordRegex, translations[locale]);
  }

  return result;
}

/**
 * Comprehensive dictionary for standard construction phase names in Real Estate Development.
 * Normalized keys (lowercase without accents) to guarantee 100% match resilience.
 */
const PHASE_NAME_TRANSLATIONS: Record<string, Record<SupportedLocale, string>> = {
  // 1. Adquisición & variantes
  adquisicion: { es: "Adquisición", en: "Acquisition", pt: "Aquisição" },
  "adquisicion y cierre": { es: "Adquisición y Cierre", en: "Acquisition & Closing", pt: "Aquisição e Fechamento" },
  "adquisicion y licencias": { es: "Adquisición y Licencias", en: "Acquisition & Licensing", pt: "Aquisição e Licenciamento" },
  cierre: { es: "Cierre", en: "Closing", pt: "Fechamento" },

  // 2. Preliminares & Estudios
  preliminares: { es: "Preliminares", en: "Preliminaries", pt: "Preliminares" },
  "estudios y licencias de construccion": { es: "Estudios y licencias de construcción", en: "Studies & Building Permits", pt: "Estudos e Licenças de Construção" },
  "estudios y licencias": { es: "Estudios y Licencias", en: "Studies & Permits", pt: "Estudos e Licenças" },
  "estudios previos": { es: "Estudios Previos", en: "Preliminary Studies", pt: "Estudos Prévios" },

  // 3. Permisos & Trámites
  permisos: { es: "Permisos", en: "Permits", pt: "Permissões" },
  "permisos y licencias": { es: "Permisos y Licencias", en: "Permits & Licensing", pt: "Permissões e Licenças" },
  "tramites y permisos": { es: "Trámites y permisos", en: "Permits & Licensing", pt: "Trâmites e Permissões" },
  "licencias y permisos": { es: "Licencias y Permisos", en: "Licenses & Permits", pt: "Licenças e Permissões" },
  tramites: { es: "Trámites", en: "Permits & Paperwork", pt: "Trâmites" },

  // 4. Inicio de obra / Demolición
  "inicio de obra": { es: "Inicio de obra", en: "Groundbreaking & Site Start", pt: "Início de Obra" },
  "inicio de obras": { es: "Inicio de obras", en: "Groundbreaking & Site Start", pt: "Início de Obras" },
  demolicion: { es: "Demolición", en: "Demolition", pt: "Demolição" },
  demoliciones: { es: "Demoliciones", en: "Demolitions", pt: "Demolições" },
  "demolicion inicial": { es: "Demolición Inicial", en: "Initial Demolition", pt: "Demolição Inicial" },
  "demolicion y limpieza": { es: "Demolición y Limpieza", en: "Demolition & Site Clearing", pt: "Demolição e Limpeza" },
  "demoliciones y/o cimentacion": { es: "Demoliciones y/o cimentación", en: "Demolitions & Foundations", pt: "Demolições e/ou Fundações" },
  "demolicion y cimentacion": { es: "Demolición y Cimentación", en: "Demolition & Foundations", pt: "Demolição e Fundação" },

  // 5. Excavación & Movimiento de tierras
  excavacion: { es: "Excavación", en: "Excavation", pt: "Escavação" },
  excavaciones: { es: "Excavaciones", en: "Excavations", pt: "Escavações" },
  "excavacion y preparacion del terreno": { es: "Excavación y preparación del terreno", en: "Excavation & Site Preparation", pt: "Escavação e Preparação do Terreno" },
  "excavacion y tierras": { es: "Excavación y Tierras", en: "Excavation & Earthmoving", pt: "Escavação e Terraplenagem" },
  "movimiento de tierras": { es: "Movimiento de tierras", en: "Earthworks", pt: "Movimentação de Terra" },
  "preparacion del terreno": { es: "Preparación del terreno", en: "Site Preparation", pt: "Preparação do Terreno" },

  // 6. Cimentación
  cimentacion: { es: "Cimentación", en: "Foundation", pt: "Fundação" },
  cimentaciones: { es: "Cimentaciones", en: "Foundations", pt: "Fundações" },
  "cimentacion profunda": { es: "Cimentación Profunda", en: "Deep Foundation", pt: "Fundação Profunda" },
  "cimentacion y zapatas estructurales": { es: "Cimentación y zapatas estructurales", en: "Foundation & Structural Footings", pt: "Fundação e Sapatas Estruturais" },
  "cimentacion y estructura": { es: "Cimentación y Estructura", en: "Foundation & Structure", pt: "Fundação e Estrutura" },
  "cimentacion y zapatas": { es: "Cimentación y Zapatas", en: "Foundation & Footings", pt: "Fundação e Sapatas" },
  zapatas: { es: "Zapatas", en: "Footings", pt: "Sapatas" },

  // 7. Estructura & Muros
  estructura: { es: "Estructura", en: "Structure", pt: "Estrutura" },
  estructuras: { es: "Estructuras", en: "Structures", pt: "Estruturas" },
  "estructura y muros": { es: "Estructura y Muros", en: "Structure & Walls", pt: "Estrutura e Paredes" },
  "construccion de estructuras y muros": { es: "Construcción de estructuras y muros", en: "Structure & Wall Construction", pt: "Construção de Estruturas e Paredes" },
  "construccion de estructuras": { es: "Construcción de estructuras", en: "Structure Construction", pt: "Construção de Estruturas" },
  "levantamiento de columnas y vigas": { es: "Levantamiento de columnas y vigas", en: "Columns & Beams Erection", pt: "Levantamento de Colunas e Vigas" },
  "columnas y vigas": { es: "Columnas y Vigas", en: "Columns & Beams", pt: "Colunas e Vigas" },
  mamposteria: { es: "Mampostería", en: "Masonry", pt: "Alvenaria" },
  "muros y mamposteria": { es: "Muros y Mampostería", en: "Walls & Masonry", pt: "Paredes e Alvenaria" },
  muros: { es: "Muros", en: "Walls", pt: "Paredes" },

  // 8. Losas & Placas
  "losa de entrepisos y placas": { es: "Losa de entrepisos y placas", en: "Mezzanine Slabs & Floor Plates", pt: "Lajes Entre Pisos e Placas" },
  "losas y placas": { es: "Losas y Placas", en: "Slabs & Floor Plates", pt: "Lajes e Placas" },
  "placas y losas": { es: "Placas y losas", en: "Floor Slabs", pt: "Lajes e Placas" },
  placas: { es: "Placas", en: "Slabs", pt: "Placas" },
  losas: { es: "Losas", en: "Slabs", pt: "Lajes" },

  // 9. Cubierta & Techos
  "cubierta o techos": { es: "Cubierta o techos", en: "Roofing & Ceilings", pt: "Cobertura ou Telhados" },
  cubierta: { es: "Cubierta", en: "Roofing", pt: "Cobertura" },
  cubiertas: { es: "Cubiertas", en: "Roofing", pt: "Coberturas" },
  "techos y cubiertas": { es: "Techos y Cubiertas", en: "Roofing & Ceilings", pt: "Telhados e Coberturas" },
  techos: { es: "Techos", en: "Roofing", pt: "Telhados" },

  // 10. Instalaciones / Redes
  instalaciones: { es: "Instalaciones", en: "MEP Installations", pt: "Instalações" },
  "instalaciones hidrosanitarias": { es: "Instalaciones hidrosanitarias", en: "Plumbing Installations", pt: "Instalações Hidrossanitárias" },
  "redes hidrosanitarias y electricas": { es: "Redes hidrosanitarias y eléctricas", en: "Plumbing & Electrical Networks", pt: "Redes Hidrossanitárias e Elétricas" },
  "redes electricas e hidrosanitarias": { es: "Redes eléctricas e hidrosanitarias", en: "Electrical & Plumbing Networks", pt: "Redes Elétricas e Hidrossanitárias" },
  "instalaciones electricas": { es: "Instalaciones Eléctricas", en: "Electrical Installations", pt: "Instalações Elétricas" },
  hidrosanitarias: { es: "Hidrosanitarias", en: "Plumbing", pt: "Hidrossanitárias" },

  // 11. Cerramientos & Carpintería
  "cerramientos y carpinteria exterior": { es: "Cerramientos y carpintería exterior", en: "Enclosures & Exterior Carpentry", pt: "Fechamentos e Carpintaria Externa" },
  cerramientos: { es: "Cerramientos", en: "Enclosures", pt: "Fechamentos" },
  "carpinteria exterior": { es: "Carpintería exterior", en: "Exterior Carpentry", pt: "Carpintaria Externa" },
  carpinteria: { es: "Carpintería", en: "Carpentry", pt: "Carpintaria" },
  "carpinteria interior": { es: "Carpintería interior", en: "Interior Carpentry", pt: "Carpintaria Interior" },

  // 12. Acabados
  acabados: { es: "Acabados", en: "Finishes", pt: "Acabamentos" },
  "acabados interiores y revestimientos": { es: "Acabados interiores y revestimientos", en: "Interior Finishes & Cladding", pt: "Acabamentos Interiores e Revestimentos" },
  "acabados interiores": { es: "Acabados interiores", en: "Interior Finishes", pt: "Acabamentos Interiores" },
  "acabados finales": { es: "Acabados finales", en: "Final Finishes", pt: "Acabamentos Finais" },
  "acabados y pintura": { es: "Acabados y Pintura", en: "Finishes & Painting", pt: "Acabamentos e Pintura" },
  revestimientos: { es: "Revestimientos", en: "Cladding & Tiling", pt: "Revestimentos" },

  // 13. Pintura
  pintura: { es: "Pintura", en: "Painting", pt: "Pintura" },
  "pintura y detalles": { es: "Pintura y detalles", en: "Painting & Detailing", pt: "Pintura e Detalhes" },
  "pintura interior y exterior": { es: "Pintura interior y exterior", en: "Interior & Exterior Painting", pt: "Pintura Interna e Externa" },

  // 14. Inspecciones & Calidad
  inspecciones: { es: "Inspecciones", en: "Inspections", pt: "Inspeções" },
  "pruebas de calidad y habitabilidad": { es: "Pruebas de calidad y habitabilidad", en: "Quality & Habitability Inspections", pt: "Testes de Qualidade e Habitabilidade" },
  "control de calidad": { es: "Control de Calidad", en: "Quality Control", pt: "Controle de Qualidade" },
  "equipamiento de zonas comunes": { es: "Equipamiento de zonas comunes", en: "Common Areas Equipment", pt: "Equipamento de Áreas Comuns" },
  equipamiento: { es: "Equipamiento", en: "Equipment", pt: "Equipamento" },

  // 15. Comercialización / Venta / Renta
  "listada para renta o venta": { es: "Listada para renta o venta", en: "Listed for Rent or Sale", pt: "Listada para Aluguel ou Venda" },
  "listada para venta o renta": { es: "Listada para venta o renta", en: "Listed for Sale or Rent", pt: "Listada para Venda ou Aluguel" },
  "listada para venta": { es: "Listada para venta", en: "Listed for Sale", pt: "Listada para Venda" },
  "listada para renta": { es: "Listada para renta", en: "Listed for Rent", pt: "Listada para Aluguel" },
  "vendida o rentada": { es: "Vendida o rentada", en: "Sold or Rented", pt: "Vendida ou Alugada" },
  "vendida o alquilada": { es: "Vendida o alquilada", en: "Sold or Rented", pt: "Vendida ou Alugada" },
  vendida: { es: "Vendida", en: "Sold", pt: "Vendida" },
  rentada: { es: "Rentada", en: "Rented", pt: "Alugada" },
  alquilada: { es: "Alquilada", en: "Rented", pt: "Alugada" },
  comercializacion: { es: "Comercialización", en: "Commercialization", pt: "Comercialização" },

  // 16. Entrega & Liquidación
  "entrega de llaves y escrituracion": { es: "Entrega de llaves y escrituración", en: "Key Handover & Title Deeds", pt: "Entrega de Chaves e Escrituração" },
  "entrega de llaves": { es: "Entrega de llaves", en: "Key Handover", pt: "Entrega de Chaves" },
  entregas: { es: "Entregas", en: "Deliveries & Handover", pt: "Entregas" },
  entrega: { es: "Entrega", en: "Handover", pt: "Entrega" },
  liquidacion: { es: "Liquidación", en: "Settlement & Liquidation", pt: "Liquidação" },
  "dispersion de pagos": { es: "Dispersión de pagos", en: "Payment Disbursement", pt: "Dispersão de Pagamentos" },
  "cierre financiero": { es: "Cierre Financiero", en: "Financial Closing", pt: "Fechamento Financeiro" },
};

/**
 * Strips accents/diacritics and normalizes text for resilient key matching.
 */
function normalizePhaseKey(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Format a construction phase name (e.g. "9. Acabados", "3. Permisos", "4. Inicio de obra")
 * according to active language customs, preserving numeric prefix ordering.
 *
 * @param phaseName - Raw phase name from database or defaults.
 * @param options - Locale override options.
 * @returns Localized phase name (e.g. "9. Finishes" or "3. Permits").
 */
export function formatPhaseName(phaseName: string | null | undefined, options?: FormatOptions): string {
  if (!phaseName || typeof phaseName !== "string") return "";

  const locale = options?.locale || DEFAULT_LOCALE;
  if (locale === "es") return phaseName;

  const trimmed = phaseName.trim();

  // Step 1: Detect numeric phase prefix (e.g. "9. ", "1 - ", "Phase 9: ")
  const prefixMatch = trimmed.match(/^(\d+[\.\-\)]\s*|\bFase\s+\d+[:\.\-]?\s*)(.*)$/i);
  let prefix = "";
  let nameBody = trimmed;

  if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
    prefix = prefixMatch[1];
    nameBody = prefixMatch[2].trim();
  }

  // Step 2: Normalize lookup key (lower case, accent-stripped)
  const lookupKey = normalizePhaseKey(nameBody);

  // Step 3: Check dictionary match
  const translationEntry = PHASE_NAME_TRANSLATIONS[lookupKey];
  if (translationEntry && translationEntry[locale]) {
    return `${prefix}${translationEntry[locale]}`;
  }

  return phaseName;
}

/**
 * Format dynamic phase description text (e.g. "Inicio: ... · Fin: ...").
 *
 * @param description - Raw description string.
 * @param options - Locale options.
 * @returns Localized description string.
 */
export function formatPhaseDescription(description: string | null | undefined, options?: FormatOptions): string {
  if (!description || typeof description !== "string") return "";

  const locale = options?.locale || DEFAULT_LOCALE;
  if (locale === "es") return description;

  if (description === "Fase de obra completada según cronograma") {
    return locale === "en"
      ? "Phase completed according to schedule"
      : "Fase de obra concluída de acordo com o cronograma";
  }

  let result = description;
  if (locale === "en") {
    result = result
      .replace(/\bInicio:/g, "Start:")
      .replace(/\bFin:/g, "End:")
      .replace(/\bEstado:/g, "Status:");
  } else if (locale === "pt") {
    result = result
      .replace(/\bInicio:/g, "Início:")
      .replace(/\bFin:/g, "Fim:")
      .replace(/\bEstado:/g, "Estado:");
  }

  // Also format any timing dates contained inside
  return formatTiming(result, options);
}

/**
 * Traverses a nested dictionary object with a dot-separated key string.
 * Example: `resolveNestedToken(dict, "dashboard.cards.investedAmount")`
 *
 * @param obj - Dictionary object tree.
 * @param path - Dot-delimited path (e.g. "landing.headline").
 * @returns Found translation string or null if path does not exist.
 */
export function resolveNestedToken(obj: unknown, path: string): string | null {
  // Step 1: Split path into key segments
  const parts = path.split(".");
  let current: unknown = obj;

  // Step 2: Traverse nested tree safely
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return typeof current === "string" ? current : null;
}

/**
 * Interpolate template strings with dynamic parameter objects.
 * Example: `interpolate("Hello {name}, you have {count} items", { name: "Sofía", count: 5 })`
 *
 * @param template - Raw translation string containing `{variable}` placeholders.
 * @param params - Key-value replacements.
 * @returns Evaluated string with replaced tokens.
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

