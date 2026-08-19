import { randomUUID } from "node:crypto";

export type CoreMetadataRecord = {
  id: string;
  kind: "collection" | "asset";
  payload: Record<string, unknown>;
  createdAt: string;
};

const metadataStore = new Map<string, CoreMetadataRecord>();

export function createCoreMetadataRecord(input: {
  kind: "collection" | "asset";
  payload: Record<string, unknown>;
}): CoreMetadataRecord {
  const record: CoreMetadataRecord = {
    id: randomUUID(),
    kind: input.kind,
    payload: input.payload,
    createdAt: new Date().toISOString()
  };

  metadataStore.set(record.id, record);
  return record;
}

export function getCoreMetadataRecord(id: string): CoreMetadataRecord | null {
  return metadataStore.get(id) ?? null;
}
