/**
 * @file tests/starter/starter.test.ts
 * @description Unit tests for starter utilities, Solana infrastructure, and pipeline execution.
 */

import { describe, test, expect } from "vitest";
import { cn, formatAddress } from "@/lib/utils";
import { getSolanaRpcUrl, getSolscanTransactionUrl } from "@/lib/infrastructure/solana";
import { executeHealthPipeline } from "@/lib/pipelines/example-pipeline";

describe("Starter Utilities & Infrastructure", () => {
  describe("cn (class names)", () => {
    test("merges conditional class names correctly", () => {
      // Arrange & Act
      const result = cn("base", true && "active", false && "hidden", undefined, null, "custom");

      // Assert
      expect(result).toBe("base active custom");
    });
  });

  describe("formatAddress", () => {
    test("formats valid Solana address into truncated representation", () => {
      // Arrange
      const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

      // Act
      const formatted = formatAddress(address, 4);

      // Assert
      expect(formatted).toBe("7xKX...gAsU");
    });

    test("returns empty string or original if invalid", () => {
      expect(formatAddress(null)).toBe("");
      expect(formatAddress("short")).toBe("short");
    });
  });

  describe("Solana Infrastructure", () => {
    test("returns devnet RPC url by default", () => {
      const url = getSolanaRpcUrl();
      expect(url).toContain("devnet");
    });

    test("generates correct Solscan Devnet transaction URL", () => {
      const sig = "5J7X...";
      const url = getSolscanTransactionUrl(sig);
      expect(url).toBe("https://solscan.io/tx/5J7X...?cluster=devnet");
    });
  });

  describe("Domain Pipeline", () => {
    test("executes health pipeline successfully against Devnet", async () => {
      // Act
      const result = await executeHealthPipeline();

      // Assert
      expect(result.success).toBe(true);
      expect(result.context.network).toBe("devnet");
      expect(result.context.rpcEndpoint).toContain("devnet");
    });
  });

  describe("Schema Validation (Zod & Valibot)", () => {
    test("validates schema with Zod v4", async () => {
      const { z } = await import("zod");
      const UserSchema = z.object({
        name: z.string(),
        rpc: z.string().url(),
      });

      const parsed = UserSchema.parse({
        name: "Solana Dev",
        rpc: "https://api.devnet.solana.com",
      });

      expect(parsed.name).toBe("Solana Dev");
      expect(parsed.rpc).toBe("https://api.devnet.solana.com");
    });

    test("validates schema with Valibot", async () => {
      const v = await import("valibot");
      const ConfigSchema = v.object({
        cluster: v.string(),
        autoConnect: v.boolean(),
      });

      const result = v.safeParse(ConfigSchema, {
        cluster: "devnet",
        autoConnect: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.cluster).toBe("devnet");
      }
    });
  });
});

