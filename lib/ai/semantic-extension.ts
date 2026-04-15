export type EmbeddingDocument = {
  id: string;
  slug: string;
  layer: "software" | "knowledge" | "regulatory";
  text: string;
  updatedAt: string;
};

export type EmbeddingVectorRecord = {
  documentId: string;
  vector: number[];
  dimensions: number;
  embeddedAt: string;
};

export type SemanticSearchMatch = {
  documentId: string;
  score: number;
};

export interface SemanticEmbeddingProvider {
  name: string;
  dimensions: number;
  embedDocuments(documents: EmbeddingDocument[]): Promise<EmbeddingVectorRecord[]>;
}

export interface SemanticRetriever {
  name: string;
  search(query: string, limit: number): Promise<SemanticSearchMatch[]>;
}

export type SemanticExtensionStatus = {
  enabled: false;
  reason: "future_extension_contract";
  notes: string;
  requires: Array<"embedding_provider" | "vector_store" | "retriever" | "indexer">;
};

export function getSemanticExtensionStatus(): SemanticExtensionStatus {
  return {
    enabled: false,
    reason: "future_extension_contract",
    notes: "R22 contract defined for future semantic/embedding activation. Runtime remains disabled in EPIC-010.",
    requires: ["embedding_provider", "vector_store", "retriever", "indexer"]
  };
}
