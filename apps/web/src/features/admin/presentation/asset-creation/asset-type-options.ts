import type { AssetType } from "@/features/admin/presentation/asset-creation/types";

export type AssetTypeSelectionOption = {
  value: Exclude<AssetType, "">;
  title: { en: string; es: string; pt: string };
  subtitle: { en: string; es: string; pt: string };
};

export const assetTypeOptions: AssetTypeSelectionOption[] = [
  {
    value: "building_new",
    title: { en: "FIX & FLIP", es: "FIX & FLIP", pt: "FIX & FLIP" },
    subtitle: {
      en: "Capital Growth",
      es: "Crecimiento de capital",
      pt: "Crescimento de capital"
    }
  },
  {
    value: "rental_property",
    title: { en: "FIX & HOLD", es: "FIX & HOLD", pt: "FIX & HOLD" },
    subtitle: {
      en: "Recurring Income",
      es: "Ingresos recurrentes",
      pt: "Renda recorrente"
    }
  },
  {
    value: "land_lot",
    title: { en: "REAL ESTATE DEV", es: "REAL ESTATE DEV", pt: "REAL ESTATE DEV" },
    subtitle: {
      en: "Projects from scratch",
      es: "Proyectos desde cero",
      pt: "Projetos do zero"
    }
  }
];
