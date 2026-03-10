export type MintBatchItem = {
  itemId: string;
  serial: number;
  expectedAddress: string | null;
  signature: string | null;
};

export type MintBatchSubmissionDraft = {
  signature: string;
  expectedAddress: string;
};

export type MintBatchSubmissionDrafts = Record<string, MintBatchSubmissionDraft>;

export type SubmitBatchPayload = {
  submissions: Array<{
    itemId: string;
    serial: number;
    signature: string;
    expectedAddress?: string;
  }>;
};

export function parsePositiveIntOrNull(rawValue: string): number | null {
  const normalized = rawValue.trim();

  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export function createSubmissionDrafts(items: MintBatchItem[]): MintBatchSubmissionDrafts {
  const drafts: MintBatchSubmissionDrafts = {};

  for (const item of items) {
    drafts[item.itemId] = {
      signature: "",
      expectedAddress: item.expectedAddress ?? ""
    };
  }

  return drafts;
}

export function buildBatchSubmitPayload(items: MintBatchItem[], drafts: MintBatchSubmissionDrafts): SubmitBatchPayload {
  const submissions = items.map((item) => {
    const draft = drafts[item.itemId];

    if (!draft) {
      throw new Error(`Missing submission draft for item ${item.itemId}.`);
    }

    const signature = draft.signature.trim();

    if (!signature) {
      throw new Error(`Signature is required for serial #${item.serial}.`);
    }

    const expectedAddress = draft.expectedAddress.trim();

    return {
      itemId: item.itemId,
      serial: item.serial,
      signature,
      ...(expectedAddress ? { expectedAddress } : {})
    };
  });

  return { submissions };
}
