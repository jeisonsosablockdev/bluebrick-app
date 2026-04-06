import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  getOrCreateProfileBundle: vi.fn(),
  updateProfileBasics: vi.fn(),
  MockProfileRepositoryError: class MockProfileRepositoryError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  getOrCreateProfileBundle: routeMocks.getOrCreateProfileBundle,
  updateProfileBasics: routeMocks.updateProfileBasics,
  ProfileRepositoryError: routeMocks.MockProfileRepositoryError
}));

import { GET, PUT } from "@/app/api/protected/profile/route";

function createGetRequest(): NextRequest {
  return new NextRequest("https://example.com/api/protected/profile", { method: "GET" });
}

function createPutRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/protected/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("/api/protected/profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.getOrCreateProfileBundle.mockResolvedValue({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      username: "user_one",
      bio: "Bio",
      avatarUrl: "https://example.com/avatar.png",
      kycStatus: "pending",
      amlStatus: "not_started",
      complianceStatus: "pending_kyc",
      rejectionReasonCode: null,
      kycProviderSessionId: null,
      kycProviderReportId: null,
      isSuspended: false,
      complianceStatusUpdatedAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z"
    });
  });

  it("returns 401 when session is missing", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(createGetRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns profile bundle for authenticated wallet", async () => {
    const response = await GET(createGetRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.walletPublicKey).toBe("Wallet11111111111111111111111111111111111");
    expect(payload.data.kycStatus).toBe("pending");
  });

  it("returns 400 for invalid profile payload", async () => {
    const response = await PUT(createPutRequest({ username: "ab", bio: "ok", avatarUrl: "https://example.com/a.png" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_PROFILE_PAYLOAD");
    expect(routeMocks.updateProfileBasics).not.toHaveBeenCalled();
  });

  it("returns 409 when username is already taken", async () => {
    routeMocks.updateProfileBasics.mockRejectedValueOnce(
      new routeMocks.MockProfileRepositoryError("USERNAME_TAKEN", "Username is already in use.")
    );

    const response = await PUT(
      createPutRequest({
        username: "valid_user",
        bio: "A valid bio",
        avatarUrl: "https://example.com/avatar.png"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("USERNAME_TAKEN");
  });

  it("updates profile for authenticated wallet", async () => {
    routeMocks.updateProfileBasics.mockResolvedValueOnce({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      username: "valid_user",
      bio: "Updated bio",
      avatarUrl: "https://example.com/new-avatar.png",
      kycStatus: "pending",
      amlStatus: "not_started",
      complianceStatus: "pending_kyc",
      rejectionReasonCode: null,
      kycProviderSessionId: null,
      kycProviderReportId: null,
      isSuspended: false,
      complianceStatusUpdatedAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:01:00.000Z"
    });

    const response = await PUT(
      createPutRequest({
        username: "valid_user",
        bio: "Updated bio",
        avatarUrl: "https://example.com/new-avatar.png"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.username).toBe("valid_user");
    expect(routeMocks.updateProfileBasics).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      username: "valid_user",
      bio: "Updated bio",
      avatarUrl: "https://example.com/new-avatar.png",
      firstName: null,
      lastName: null,
      country: null,
      stateProvince: null,
      email: null,
      address: null,
      phone: null
    });
  });
});
