export type MachineReadableSection = "knowledge" | "regulatory";

export const MACHINE_ENDPOINTS = {
  llms: "/llms.txt",
  aiTxt: "/ai.txt",
  knowledgeJson: "/knowledge.json",
  knowledgeApi: "/api/knowledge",
  entitiesApi: "/api/entities",
  definitionsApi: "/api/definitions",
  feedRss: "/feeds/rss",
  feedJson: "/feeds/json",
  feedRecent: "/feeds/recent",
  feedExport: "/feeds/export",
  feedSearchIndex: "/feeds/search-index"
} as const;
