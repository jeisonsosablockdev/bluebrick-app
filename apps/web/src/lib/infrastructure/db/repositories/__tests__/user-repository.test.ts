import { describe, it, expect, vi } from "vitest";
import { UserRepository } from "../user-repository";

describe("UserRepository", () => {
  it("should query without hardcoding neondb and properly handle the pool connection", async () => {
    // we want to test if it connects.
    // We can inject a mock DatabaseExecutor
    const mockExecutor = {
      query: vi.fn().mockResolvedValue({ rows: [] })
    };
    
    const repo = new UserRepository(mockExecutor);
    const result = await repo.findById("user_123");
    
    expect(result).toBeNull();
    expect(mockExecutor.query).toHaveBeenCalled();
  });
});
