import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  addComplianceCaseNote: vi.fn(),
  getComplianceCaseNotes: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/profile/application/case-service", () => ({
  ComplianceCaseServiceError: class ComplianceCaseServiceError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
  addComplianceCaseNote: routeMocks.addComplianceCaseNote,
  getComplianceCaseNotes: routeMocks.getComplianceCaseNotes
}));

import { GET, POST } from "@/app/api/admin/compliance/cases/[walletPublicKey]/notes/route";

function createGetRequest(): NextRequest {
  return new NextRequest("https://example.com/api/admin/compliance/cases/Wallet11111111111111111111111111111111111/notes?limit=10", {
    method: "GET"
  });
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/compliance/cases/Wallet11111111111111111111111111111111111/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("GET/POST /api/admin/compliance/cases/:walletPublicKey/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin1111111111111111111111111111111111111"
    });
    routeMocks.getComplianceCaseNotes.mockResolvedValue([
      {
        id: "1",
        walletPublicKey: "Wallet11111111111111111111111111111111111",
        noteText: "review in progress",
        actorId: "Admin1111111111111111111111111111111111111",
        createdAt: "2026-03-26T00:00:00.000Z"
      }
    ]);
    routeMocks.addComplianceCaseNote.mockResolvedValue({
      id: "2",
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      noteText: "escalated",
      actorId: "Admin1111111111111111111111111111111111111",
      createdAt: "2026-03-26T00:01:00.000Z"
    });
  });

  it("returns notes list for admin", async () => {
    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.notes).toHaveLength(1);
    expect(routeMocks.getComplianceCaseNotes).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      limit: 10
    });
  });

  it("creates note for admin", async () => {
    const response = await POST(createPostRequest({ noteText: "escalated" }), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.noteText).toBe("escalated");
    expect(routeMocks.addComplianceCaseNote).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      adminActorId: "Admin1111111111111111111111111111111111111",
      noteText: "escalated"
    });
  });
});
