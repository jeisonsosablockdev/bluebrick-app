import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  parseInvestmentBriefPdfBuffer: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/asset-pdf-server", () => ({
  parseInvestmentBriefPdfBuffer: routeMocks.parseInvestmentBriefPdfBuffer
}));

import { POST } from "@/app/api/admin/assets/import-preview/route";

function createMultipartRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append("file", file);

  return new NextRequest("https://example.com/api/admin/assets/import-preview", {
    method: "POST",
    body: formData
  });
}

describe("POST /api/admin/assets/import-preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.parseInvestmentBriefPdfBuffer.mockResolvedValue({
      extractedText: "Deal Number: 117",
      headers: ["assetType", "internalCode"],
      rows: [{ assetType: "building_new", internalCode: "117" }]
    });
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "UserPubkey111111111111111111111111111111111111"
    });

    const response = await POST(createMultipartRequest(new File(["pdf"], "brief.pdf", { type: "application/pdf" })));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns 415 for non-pdf uploads", async () => {
    const response = await POST(createMultipartRequest(new File(["csv"], "brief.csv", { type: "text/csv" })));
    const payload = await response.json();

    expect(response.status).toBe(415);
    expect(payload.error.code).toBe("UNSUPPORTED_IMPORT_FILE");
    expect(routeMocks.parseInvestmentBriefPdfBuffer).not.toHaveBeenCalled();
  });

  it("returns parsed preview payload for supported pdfs", async () => {
    const response = await POST(createMultipartRequest(new File(["pdf"], "brief.pdf", { type: "application/pdf" })));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.fileName).toBe("brief.pdf");
    expect(payload.data.fingerprint).toContain("pdf:brief.pdf:");
    expect(payload.data.text).toBe("");
    expect(payload.data.rows[0]).toEqual({
      assetType: "building_new",
      internalCode: "117"
    });
    expect(routeMocks.parseInvestmentBriefPdfBuffer).toHaveBeenCalledTimes(1);
  });
});
