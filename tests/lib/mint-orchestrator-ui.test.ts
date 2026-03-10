import { describe, expect, it } from "vitest";

import {
  buildBatchSubmitPayload,
  createSubmissionDrafts,
  parsePositiveIntOrNull,
  type MintBatchItem
} from "@/lib/mint-orchestrator-ui";

const batchItems: MintBatchItem[] = [
  {
    itemId: "item-1",
    serial: 101,
    expectedAddress: "AssetAddress111",
    signature: null
  },
  {
    itemId: "item-2",
    serial: 102,
    expectedAddress: null,
    signature: null
  }
];

describe("lib/mint-orchestrator-ui", () => {
  it("parses positive integer values", () => {
    expect(parsePositiveIntOrNull("25")).toBe(25);
    expect(parsePositiveIntOrNull(" 4 ")).toBe(4);
  });

  it("returns null for invalid positive integers", () => {
    expect(parsePositiveIntOrNull("")).toBeNull();
    expect(parsePositiveIntOrNull("0")).toBeNull();
    expect(parsePositiveIntOrNull("-2")).toBeNull();
    expect(parsePositiveIntOrNull("2.5")).toBeNull();
    expect(parsePositiveIntOrNull("abc")).toBeNull();
  });

  it("creates submission drafts from batch items", () => {
    const drafts = createSubmissionDrafts(batchItems);

    expect(drafts).toEqual({
      "item-1": {
        signature: "",
        expectedAddress: "AssetAddress111"
      },
      "item-2": {
        signature: "",
        expectedAddress: ""
      }
    });
  });

  it("builds submit payload trimming signature and expected address", () => {
    const payload = buildBatchSubmitPayload(batchItems, {
      "item-1": {
        signature: "  sig-111  ",
        expectedAddress: " AssetAddress111 "
      },
      "item-2": {
        signature: "sig-222",
        expectedAddress: "  "
      }
    });

    expect(payload).toEqual({
      submissions: [
        {
          itemId: "item-1",
          serial: 101,
          signature: "sig-111",
          expectedAddress: "AssetAddress111"
        },
        {
          itemId: "item-2",
          serial: 102,
          signature: "sig-222"
        }
      ]
    });
  });

  it("throws when batch item draft is missing", () => {
    expect(() =>
      buildBatchSubmitPayload(batchItems, {
        "item-1": {
          signature: "sig-111",
          expectedAddress: "AssetAddress111"
        }
      })
    ).toThrow("Missing submission draft for item item-2.");
  });

  it("throws when signature is empty for a batch item", () => {
    expect(() =>
      buildBatchSubmitPayload(batchItems, {
        "item-1": {
          signature: "",
          expectedAddress: "AssetAddress111"
        },
        "item-2": {
          signature: "sig-222",
          expectedAddress: ""
        }
      })
    ).toThrow("Signature is required for serial #101.");
  });
});
