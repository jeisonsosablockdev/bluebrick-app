export type AppLayer = "software" | "knowledge" | "regulatory";

export const LAYER_PATHS: Record<AppLayer, string> = {
  software: "/software",
  knowledge: "/knowledge",
  regulatory: "/regulatory"
};
