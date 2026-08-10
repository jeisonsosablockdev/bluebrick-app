import type { CollectionBootstrapDocumentTag } from "@/lib/admin/collection-bootstrap-mapper";
import { localize, type AppLocale } from "@/lib/i18n";

export function formatAdminCollectionDocumentTag(
  locale: AppLocale,
  tag: CollectionBootstrapDocumentTag
): string {
  switch (tag) {
    case "brochure":
      return localize(locale, { en: "Brochure", es: "Brochure", pt: "Brochura" });
    case "legal":
      return localize(locale, { en: "Legal", es: "Legal", pt: "Legal" });
    case "financial":
      return localize(locale, { en: "Financial", es: "Financiero", pt: "Financeiro" });
    case "title-report":
      return localize(locale, { en: "Title report", es: "Title report", pt: "Title report" });
    case "appraisal":
      return localize(locale, { en: "Appraisal", es: "Avaluo", pt: "Avaliacao" });
    case "lease":
      return localize(locale, { en: "Lease", es: "Lease", pt: "Lease" });
    case "agreement":
      return localize(locale, { en: "Agreement", es: "Acuerdo", pt: "Acordo" });
    case "inspection":
      return localize(locale, { en: "Inspection", es: "Inspeccion", pt: "Inspecao" });
    case "tax":
      return localize(locale, { en: "Tax", es: "Impuestos", pt: "Impostos" });
    case "insurance":
      return localize(locale, { en: "Insurance", es: "Seguro", pt: "Seguro" });
    case "permit":
      return localize(locale, { en: "Permit", es: "Permiso", pt: "Permissao" });
    case "floor-plan":
      return localize(locale, { en: "Floor plan", es: "Plano", pt: "Planta" });
    default:
      return localize(locale, { en: "Other", es: "Otro", pt: "Outro" });
  }
}
