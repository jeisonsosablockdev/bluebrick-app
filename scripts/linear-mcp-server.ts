import { createRequire } from "node:module";

import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import * as z from "zod4";

const require = createRequire(import.meta.url);
const {
  linearGraphQLRequest,
  normalizeIssueKey,
  updateLinearIssueStatus
} = require("./linear-status-core.js");

const LINEAR_GRAPHQL_ENDPOINT = process.env.LINEAR_GRAPHQL_ENDPOINT || "https://api.linear.app/graphql";

type IssueState = {
  id?: string;
  name?: string | null;
  type?: string | null;
};

type LinearIssueSummary = {
  id: string;
  identifier?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  updatedAt?: string | null;
  state?: IssueState | null;
  assignee?: {
    id?: string;
    name?: string | null;
  } | null;
  team?: {
    id?: string;
    name?: string | null;
  } | null;
};

type LinearCommentSummary = {
  id: string;
  body?: string | null;
  createdAt?: string | null;
  url?: string | null;
  user?: {
    id?: string;
    name?: string | null;
  } | null;
};

type LinearViewerIssueNode = {
  id?: string;
  identifier?: string | null;
  title?: string | null;
  url?: string | null;
  updatedAt?: string | null;
  state?: IssueState | null;
  team?: { name?: string | null } | null;
};

type LinearTeamNode = {
  id?: string;
  key?: string | null;
  name?: string | null;
};

function requireLinearApiKey(): string {
  const apiKey = String(process.env.LINEAR_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error(
      "LINEAR_API_KEY is required. Create a personal Linear API key and export it before starting the MCP server."
    );
  }
  return apiKey;
}

function toTextContent(text: string) {
  return [{ type: "text" as const, text }];
}

function summarizeIssue(issue: LinearIssueSummary): string {
  const assignee = issue.assignee?.name || "unassigned";
  const state = issue.state?.name || "unknown";
  const team = issue.team?.name || "unknown team";
  const description = issue.description ? ["", issue.description] : [];

  return [
    `# ${issue.identifier || issue.id}`,
    "",
    `- Title: ${issue.title || "untitled"}`,
    `- Team: ${team}`,
    `- State: ${state}`,
    `- Assignee: ${assignee}`,
    `- URL: ${issue.url || "n/a"}`,
    ...description
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchIssue(issueKey: string): Promise<LinearIssueSummary> {
  const data = await linearGraphQLRequest({
    apiKey: requireLinearApiKey(),
    endpoint: LINEAR_GRAPHQL_ENDPOINT,
    query: `
      query LinearIssueBridgeIssue($issueId: String!) {
        issue(id: $issueId) {
          id
          identifier
          title
          description
          url
          updatedAt
          state {
            id
            name
            type
          }
          assignee {
            id
            name
          }
          team {
            id
            name
          }
        }
      }
    `,
    variables: {
      issueId: normalizeIssueKey(issueKey)
    }
  });

  const issue = data?.issue;
  if (!issue) {
    throw new Error(`Linear issue not found: ${issueKey}`);
  }

  return issue as LinearIssueSummary;
}

async function listTeams(): Promise<LinearTeamNode[]> {
  const data = await linearGraphQLRequest({
    apiKey: requireLinearApiKey(),
    endpoint: LINEAR_GRAPHQL_ENDPOINT,
    query: `
      query LinearBridgeTeams {
        teams {
          nodes {
            id
            key
            name
          }
        }
      }
    `,
    variables: {}
  });

  return (data?.teams?.nodes || []) as LinearTeamNode[];
}

async function resolveTeamId(teamInput: string): Promise<string> {
  const normalized = String(teamInput ?? "").trim();
  if (!normalized) {
    throw new Error("A Linear team is required.");
  }

  const teams = await listTeams();
  const match = teams.find((team) => {
    return (
      String(team.id || "").trim() === normalized ||
      String(team.name || "").trim().toLowerCase() === normalized.toLowerCase() ||
      String(team.key || "").trim().toLowerCase() === normalized.toLowerCase()
    );
  });

  if (!match?.id) {
    const available = teams.map((team) => `${team.key || team.id || "unknown"}: ${team.name || "untitled"}`).join(", ");
    throw new Error(`Unable to resolve Linear team '${teamInput}'. Available teams: ${available || "none"}.`);
  }

  return match.id;
}

async function createIssueOnLinear({
  team,
  title,
  description,
  state
}: {
  team: string;
  title: string;
  description?: string;
  state?: string;
}): Promise<LinearIssueSummary> {
  const teamId = await resolveTeamId(team);
  const data = await linearGraphQLRequest({
    apiKey: requireLinearApiKey(),
    endpoint: LINEAR_GRAPHQL_ENDPOINT,
    query: `
      mutation LinearBridgeIssueCreate($teamId: String!, $title: String!, $description: String) {
        issueCreate(input: { teamId: $teamId, title: $title, description: $description }) {
          success
          issue {
            id
            identifier
            title
            description
            url
            updatedAt
            state {
              id
              name
              type
            }
            assignee {
              id
              name
            }
            team {
              id
              name
            }
          }
        }
      }
    `,
    variables: {
      teamId,
      title,
      description: description || null
    }
  });

  const payload = data?.issueCreate;
  if (!payload?.success || !payload?.issue) {
    throw new Error(`Failed to create Linear issue '${title}'.`);
  }

  const createdIssue = payload.issue as LinearIssueSummary;
  if (state) {
    await updateLinearIssueStatus({
      issueKey: createdIssue.identifier || createdIssue.id,
      stateCommand: state
    });
    return fetchIssue(createdIssue.identifier || createdIssue.id);
  }

  return createdIssue;
}

async function updateIssueOnLinear({
  issue,
  title,
  description,
  state
}: {
  issue: string;
  title?: string;
  description?: string;
  state?: string;
}): Promise<LinearIssueSummary> {
  const issueKey = normalizeIssueKey(issue);
  const input: Record<string, string> = {};

  if (typeof title === "string" && title.trim()) {
    input.title = title.trim();
  }
  if (typeof description === "string") {
    input.description = description;
  }

  if (Object.keys(input).length > 0) {
    const data = await linearGraphQLRequest({
      apiKey: requireLinearApiKey(),
      endpoint: LINEAR_GRAPHQL_ENDPOINT,
      query: `
        mutation LinearBridgeIssueUpdate($issueId: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $issueId, input: $input) {
            success
            issue {
              id
              identifier
              title
              description
              url
              updatedAt
              state {
                id
                name
                type
              }
              assignee {
                id
                name
              }
              team {
                id
                name
              }
            }
          }
        }
      `,
      variables: {
        issueId: issueKey,
        input
      }
    });

    const payload = data?.issueUpdate;
    if (!payload?.success || !payload?.issue) {
      throw new Error(`Failed to update Linear issue ${issueKey}.`);
    }
  }

  if (state) {
    const stateResult = await updateLinearIssueStatus({
      issueKey,
      stateCommand: state
    });
    if (!stateResult.skipped) {
      return fetchIssue(issueKey);
    }
  }

  return fetchIssue(issueKey);
}

async function listMyIssues(limit = 10): Promise<LinearViewerIssueNode[]> {
  const data = await linearGraphQLRequest({
    apiKey: requireLinearApiKey(),
    endpoint: LINEAR_GRAPHQL_ENDPOINT,
    query: `
      query LinearViewerAssignedIssues {
        viewer {
          id
          name
          assignedIssues {
            nodes {
              id
              identifier
              title
              url
              updatedAt
              state {
                id
                name
                type
              }
              team {
                name
              }
            }
          }
        }
      }
    `,
    variables: {}
  });

  const nodes = (data?.viewer?.assignedIssues?.nodes || []) as LinearViewerIssueNode[];
  return nodes.slice(0, Math.max(1, Math.min(100, limit)));
}

async function addIssueComment(issueKey: string, body: string): Promise<LinearCommentSummary> {
  const data = await linearGraphQLRequest({
    apiKey: requireLinearApiKey(),
    endpoint: LINEAR_GRAPHQL_ENDPOINT,
    query: `
      mutation LinearIssueBridgeCommentCreate($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
          comment {
            id
            body
            createdAt
            url
            user {
              id
              name
            }
          }
        }
      }
    `,
    variables: {
      issueId: normalizeIssueKey(issueKey),
      body
    }
  });

  const payload = data?.commentCreate;
  if (!payload?.success || !payload?.comment) {
    throw new Error(`Failed to add comment to Linear issue ${issueKey}.`);
  }

  return payload.comment as LinearCommentSummary;
}

function buildIssueListMarkdown(issues: LinearViewerIssueNode[]): string {
  if (!issues.length) {
    return "No assigned issues found.";
  }

  return issues
    .map((issue, index) => {
      const state = issue.state?.name || "unknown";
      const team = issue.team?.name || "unknown team";
      return `${index + 1}. ${issue.identifier || issue.id} - ${issue.title || "untitled"} [${team} / ${state}]`;
    })
    .join("\n");
}

function buildTeamListMarkdown(teams: LinearTeamNode[]): string {
  if (!teams.length) {
    return "No Linear teams found.";
  }

  return teams
    .map((team, index) => {
      return `${index + 1}. ${team.key || team.id || "unknown"} - ${team.name || "untitled"}`;
    })
    .join("\n");
}

function buildCommentMarkdown(comment: LinearCommentSummary, issueKey: string): string {
  return [
    `Comment added to ${issueKey}.`,
    "",
    `- Comment ID: ${comment.id}`,
    `- Created At: ${comment.createdAt || "n/a"}`,
    `- URL: ${comment.url || "n/a"}`
  ].join("\n");
}

function makeToolResult(text: string) {
  return {
    content: toTextContent(text)
  };
}

async function main() {
  const server = new McpServer({
    name: "brids-linear-bridge",
    version: "0.1.0"
  });

  server.registerTool(
    "linear_get_issue",
    {
      title: "Get Linear Issue",
      description: "Fetch a Linear issue by identifier and return a compact summary.",
      inputSchema: z.object({
        issue: z.string().min(1).describe("Linear issue key, for example BRI-38")
      }) as any
    },
    async (args: any) => {
      const { issue } = args;
      const issueData = await fetchIssue(issue);
      return makeToolResult(summarizeIssue(issueData));
    }
  );

  server.registerTool(
    "linear_list_my_issues",
    {
      title: "List My Issues",
      description: "List issues assigned to the authenticated Linear user.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional().default(10)
      }) as any
    },
    async (args: any) => {
      const { limit } = args;
      const issues = await listMyIssues(limit);
      return makeToolResult(buildIssueListMarkdown(issues));
    }
  );

  server.registerTool(
    "linear_list_teams",
    {
      title: "List Linear Teams",
      description: "List the Linear teams available in this workspace.",
      inputSchema: z.object({}) as any
    },
    async () => {
      const teams = await listTeams();
      return makeToolResult(buildTeamListMarkdown(teams));
    }
  );

  server.registerTool(
    "linear_create_issue",
    {
      title: "Create Linear Issue",
      description: "Create a Linear issue in a team.",
      inputSchema: z.object({
        team: z.string().min(1).describe("Team name, key, or UUID"),
        title: z.string().min(1).describe("Issue title"),
        description: z.string().optional().describe("Optional Markdown description"),
        state: z.string().optional().describe("Optional workflow state command such as start, review, or done")
      }) as any
    },
    async ({ team, title, description, state }: any) => {
      const issue = await createIssueOnLinear({ team, title, description, state });
      return makeToolResult(summarizeIssue(issue));
    }
  );

  server.registerTool(
    "linear_update_issue",
    {
      title: "Update Linear Issue",
      description: "Update a Linear issue title or description, and optionally move its state.",
      inputSchema: z.object({
        issue: z.string().min(1).describe("Linear issue key, for example BRI-38"),
        title: z.string().optional().describe("Optional new issue title"),
        description: z.string().optional().describe("Optional new Markdown description"),
        state: z.string().optional().describe("Optional workflow state command such as start, review, or done")
      }) as any
    },
    async ({ issue, title, description, state }: any) => {
      const updatedIssue = await updateIssueOnLinear({ issue, title, description, state });
      return makeToolResult(summarizeIssue(updatedIssue));
    }
  );

  server.registerTool(
    "linear_update_issue_state",
    {
      title: "Update Linear Issue State",
      description: "Move a Linear issue to a workflow state such as In Progress, In Review, or Done.",
      inputSchema: z.object({
        issue: z.string().min(1).optional().describe("Linear issue key, for example BRI-38"),
        branch: z.string().min(1).optional().describe("Branch name to resolve the issue from if issue is omitted"),
        state: z.enum(["start", "review", "done"]).describe("Target workflow state")
      }) as any
    },
    async ({ issue, branch, state }: any) => {
      const result = await updateLinearIssueStatus({
        issueKey: issue,
        branchName: branch,
        stateCommand: state
      });

      if (result.skipped) {
        return makeToolResult(`Linear status sync skipped: ${result.reason}.`);
      }

      return makeToolResult(`Linear issue ${result.issueId} moved to ${result.stateName}.`);
    }
  );

  server.registerTool(
    "linear_add_comment",
    {
      title: "Add Linear Comment",
      description: "Post a comment to a Linear issue.",
      inputSchema: z.object({
        issue: z.string().min(1).describe("Linear issue key, for example BRI-38"),
        body: z.string().min(1).describe("Comment body in Markdown")
      }) as any
    },
    async ({ issue, body }: any) => {
      const comment = await addIssueComment(issue, body);
      return makeToolResult(buildCommentMarkdown(comment, normalizeIssueKey(issue)));
    }
  );

  server.registerPrompt(
    "linear_issue_brief",
    {
      title: "Linear Issue Brief",
      description: "Generate a concise issue brief for a Linear ticket based on the current repo protocol.",
      argsSchema: z.object({
        issue: z.string().min(1).describe("Linear issue key, for example BRI-38")
      }) as any
    },
    async (args: any) => {
      const { issue } = args;
      const issueData = await fetchIssue(issue);
      return {
        messages: [
          {
            role: "assistant" as const,
            content: {
              type: "text" as const,
              text: [
                `Issue: ${issueData.identifier || issueData.id}`,
                `Title: ${issueData.title || "untitled"}`,
                `State: ${issueData.state?.name || "unknown"}`,
                "",
                "Use the repository's documentation-first flow before making code changes.",
                "Document the human brief, then the technical slices, then start the first SPEC."
              ].join("\n")
            }
          }
        ]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(`❌ Linear MCP server failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
