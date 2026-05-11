export const CONTENT_LAYER_DIRS = {
  software: "content/software",
  knowledge: "content/knowledge",
  regulatory: "content/regulatory"
} as const;

export type ContentLayer = keyof typeof CONTENT_LAYER_DIRS;
