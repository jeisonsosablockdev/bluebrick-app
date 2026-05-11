import { describe, expect, it } from "vitest";

import {
  buildVersionedObjectKey,
  generateUploadId,
  isUuidV4,
  parseFinalizeUploadRequest,
  parseSignedUrlRequest,
  sanitizeFileName
} from "@/lib/asset-uploads/policy";

const DRAFT_ID = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const EDIT_SESSION_ID = "0f9748d3-a4c8-4058-930d-b6949f43d18c";

describe("lib/asset-uploads/policy", () => {
  it("generates UUIDv4 upload ids", () => {
    const uploadId = generateUploadId();
    expect(isUuidV4(uploadId)).toBe(true);
  });

  it("sanitizes file names and removes traversal patterns", () => {
    const sanitized = sanitizeFileName("../../../../etc/passwd.pdf");
    expect(sanitized.originalFileName).toBe("../../../../etc/passwd.pdf");
    expect(sanitized.sanitizedFileName).toBe("passwd.pdf");
    expect(sanitized.sanitizedFileName.includes("..")).toBe(false);
    expect(sanitized.sanitizedFileName.includes("/")).toBe(false);
  });

  it("parses valid signed-url request payloads", () => {
    const parsed = parseSignedUrlRequest({
      category: "galleryImage",
      fileName: "front-view.png",
      mimeType: "image/png",
      sizeBytes: 512_000,
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      draftId: DRAFT_ID,
      editSessionId: EDIT_SESSION_ID
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.category).toBe("galleryImage");
    expect(parsed.value.mimeType).toBe("image/png");
    expect(parsed.value.editSessionId).toBe(EDIT_SESSION_ID);
  });

  it("rejects signed-url requests with invalid editSessionId", () => {
    const parsed = parseSignedUrlRequest({
      category: "galleryImage",
      fileName: "front-view.pdf",
      mimeType: "image/png",
      sizeBytes: 1000,
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      draftId: DRAFT_ID,
      editSessionId: "invalid"
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.code).toBe("INVALID_UPLOAD_REQUEST");
  });

  it("rejects signed-url requests with mismatched extension and mime type", () => {
    const parsed = parseSignedUrlRequest({
      category: "galleryImage",
      fileName: "front-view.pdf",
      mimeType: "image/png",
      sizeBytes: 1000,
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      draftId: DRAFT_ID
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.code).toBe("MIME_NOT_ALLOWED");
  });

  it("builds safe versioned object keys", () => {
    const objectKey = buildVersionedObjectKey({
      category: "legalDoc",
      draftId: DRAFT_ID,
      fileName: "../../Contrato Final.PDF",
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      mimeType: "application/pdf",
      now: new Date("2026-03-15T18:00:00.000Z"),
      nonce: "abc123ef"
    });

    expect(objectKey.startsWith(`admin-assets/legalDoc/${DRAFT_ID}/`)).toBe(true);
    expect(objectKey.endsWith(".pdf")).toBe(true);
    expect(objectKey.includes("..")).toBe(false);
    expect(objectKey.includes(" ")).toBe(false);
  });

  it("parses finalize payload with required fields", () => {
    const parsed = parseFinalizeUploadRequest({
      draftId: DRAFT_ID,
      sizeBytes: 1024,
      mimeType: "application/pdf",
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      editSessionId: EDIT_SESSION_ID,
      etag: "\"abcd1234\"",
      previousCdnUrl: "https://cdn.example.com/admin-assets/legalDoc/file-a.pdf"
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.etag).toBe("abcd1234");
    expect(parsed.value.editSessionId).toBe(EDIT_SESSION_ID);
    expect(parsed.value.previousCdnUrl).toBe("https://cdn.example.com/admin-assets/legalDoc/file-a.pdf");
  });

  it("rejects finalize payload with invalid editSessionId type", () => {
    const parsed = parseFinalizeUploadRequest({
      draftId: DRAFT_ID,
      editSessionId: 123,
      sizeBytes: 1024,
      mimeType: "application/pdf",
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      previousCdnUrl: 123
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.code).toBe("INVALID_UPLOAD_REQUEST");
  });

  it("rejects finalize payload with invalid previousCdnUrl type", () => {
    const parsed = parseFinalizeUploadRequest({
      draftId: DRAFT_ID,
      sizeBytes: 1024,
      mimeType: "application/pdf",
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      previousCdnUrl: 123
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.code).toBe("INVALID_UPLOAD_REQUEST");
  });
});
