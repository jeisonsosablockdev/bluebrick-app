import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const monitorMocks = vi.hoisted(() => ({
  runClaims48hExpiryMonitor: vi.fn(),
  runComplianceHoldTtlMonitor: vi.fn()
}));

vi.mock("@/features/staking-distribution/application/compliance-monitor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/staking-distribution/application/compliance-monitor")>();
  return {
    ...actual,
    runClaims48hExpiryMonitor: monitorMocks.runClaims48hExpiryMonitor,
    runComplianceHoldTtlMonitor: monitorMocks.runComplianceHoldTtlMonitor
  };
});

import { GET as claimsExpiryGet, POST as claimsExpiryPost } from "@/app/api/cron/claims-expiry/route";
import { GET as complianceTtlGet, POST as complianceTtlPost } from "@/app/api/cron/compliance-ttl/route";

describe("Cron API Routes", () => {
  const originalEnv = process.env.CRON_SECRET;
  const testSecret = "test-cron-secret-1234567890";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = testSecret;
  });

  describe("GET & POST /api/cron/claims-expiry", () => {
    it("should reject requests without authorization header with 401", async () => {
      const request = new NextRequest("http://localhost/api/cron/claims-expiry");
      const response = await claimsExpiryGet(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject requests with invalid bearer secret with 401", async () => {
      const request = new NextRequest("http://localhost/api/cron/claims-expiry", {
        headers: {
          authorization: "Bearer wrong-secret-token"
        }
      });
      const response = await claimsExpiryPost(request);
      expect(response.status).toBe(401);
    });

    it("should execute claims expiry monitor on valid secret (GET)", async () => {
      monitorMocks.runClaims48hExpiryMonitor.mockResolvedValueOnce({
        scannedCount: 10,
        expiredCount: 3,
        expiredClaims: []
      });

      const request = new NextRequest("http://localhost/api/cron/claims-expiry", {
        headers: {
          authorization: `Bearer ${testSecret}`
        }
      });
      const response = await claimsExpiryGet(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.expiredCount).toBe(3);
      expect(monitorMocks.runClaims48hExpiryMonitor).toHaveBeenCalledTimes(1);
    });

    it("should execute claims expiry monitor on valid secret (POST)", async () => {
      monitorMocks.runClaims48hExpiryMonitor.mockResolvedValueOnce({
        scannedCount: 5,
        expiredCount: 0,
        expiredClaims: []
      });

      const request = new NextRequest("http://localhost/api/cron/claims-expiry", {
        method: "POST",
        headers: {
          authorization: `Bearer ${testSecret}`
        }
      });
      const response = await claimsExpiryPost(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.scannedCount).toBe(5);
    });
  });

  describe("GET & POST /api/cron/compliance-ttl", () => {
    it("should reject requests without authorization header with 401", async () => {
      const request = new NextRequest("http://localhost/api/cron/compliance-ttl");
      const response = await complianceTtlGet(request);
      expect(response.status).toBe(401);
    });

    it("should execute compliance TTL monitor on valid secret (GET)", async () => {
      monitorMocks.runComplianceHoldTtlMonitor.mockResolvedValueOnce({
        scannedCount: 8,
        clawedBackCount: 2,
        clawedBackClaims: []
      });

      const request = new NextRequest("http://localhost/api/cron/compliance-ttl", {
        headers: {
          authorization: `Bearer ${testSecret}`
        }
      });
      const response = await complianceTtlGet(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.clawedBackCount).toBe(2);
      expect(monitorMocks.runComplianceHoldTtlMonitor).toHaveBeenCalledTimes(1);
    });
  });
});
