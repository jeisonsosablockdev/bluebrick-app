export type MachineReadableSection = "knowledge" | "regulatory";

export const MACHINE_ENDPOINTS = {
  llms: "/llms.txt",
  knowledgeJson: "/knowledge.json"
} as const;
