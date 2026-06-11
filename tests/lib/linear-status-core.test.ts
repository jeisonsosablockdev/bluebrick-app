import { describe, expect, it, vi } from "vitest";

const {
  normalizeIssueKey,
  normalizeStateCommand,
  parseIssueKeyFromBranchName,
  updateLinearIssueStatus
} = require("../../scripts/linear-status-core.js");

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("scripts/linear-status-core", () => {
  it("normalizes Linear issue keys and status commands", () => {
    expect(normalizeIssueKey("bri-149")).toBe("BRI-149");
    expect(normalizeIssueKey("EPIC-011")).toBe("EPIC-011");
    expect(normalizeStateCommand("In Progress")).toBe("start");
    expect(normalizeStateCommand("in-review")).toBe("review");
    expect(normalizeStateCommand("done")).toBe("done");
    expect(parseIssueKeyFromBranchName("feature/czambrano-BRI-38-fix-ui-elements")).toBe("BRI-38");
  });

  it("moves an issue into the requested Linear workflow state", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}"));

      if (body.query.includes("query LinearIssueStatus")) {
        return jsonResponse({
          data: {
            issue: {
              id: "issue-1",
              identifier: "BRI-38",
              title: "Landing page rewrite",
              team: {
                id: "team-1",
                name: "BRIDS",
                startedStates: {
                  nodes: [
                    { id: "state-start", name: "In Progress", position: 1 },
                    { id: "state-review", name: "In Review", position: 2 }
                  ]
                },
                completedStates: {
                  nodes: [{ id: "state-done", name: "Done", position: 1 }]
                }
              }
            }
          }
        });
      }

      return jsonResponse({
        data: {
          issueUpdate: {
            success: true,
            issue: {
              id: "issue-1",
              identifier: "BRI-38",
              title: "Landing page rewrite",
              state: {
                id: "state-review",
                name: "In Review"
              }
            }
          }
        }
      });
    });

    const result = await updateLinearIssueStatus({
      issueKey: "BRI-38",
      stateCommand: "review",
      apiKey: "linear-test-key",
      fetchImpl: fetchMock,
      logger: { info: vi.fn() }
    });

    expect(result).toEqual({
      issueId: "BRI-38",
      stateName: "In Review",
      skipped: false
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCallBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body ?? "{}"));
    const secondCallBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body ?? "{}"));

    expect(firstCallBody.variables.issueId).toBe("BRI-38");
    expect(secondCallBody.variables.stateId).toBe("state-review");
  });

  it("skips safely when auto-status is disabled", async () => {
    const logger = { info: vi.fn() };
    const previousAutoStatus = process.env.LINEAR_AUTOSTATUS;
    process.env.LINEAR_AUTOSTATUS = "0";

    try {
      const disabledResult = await updateLinearIssueStatus({
        issueKey: "BRI-38",
        stateCommand: "start",
        apiKey: "linear-test-key",
        fetchImpl: vi.fn(),
        logger,
        cwd: process.cwd()
      });

      expect(disabledResult).toEqual({
        reason: "disabled",
        skipped: true
      });
    } finally {
      if (previousAutoStatus === undefined) {
        delete process.env.LINEAR_AUTOSTATUS;
      } else {
        process.env.LINEAR_AUTOSTATUS = previousAutoStatus;
      }
    }
  });

  it("skips safely when the issue key cannot be resolved", async () => {
    const logger = { info: vi.fn() };

    const unresolvedResult = await updateLinearIssueStatus({
      branchName: "docs/readme",
      stateCommand: "review",
      apiKey: "linear-test-key",
      fetchImpl: vi.fn(),
      logger,
      cwd: process.cwd()
    });

    expect(unresolvedResult).toEqual({
      reason: "issue-key-unresolved",
      skipped: true
    });
  });
});
