#!/usr/bin/env tsx

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
};

const LINEAR_API_URL = "https://api.linear.app/graphql";
const protocolVersion = "2024-11-05";
const homeDir = process.env.HOME || "";

const tools = [
  {
    name: "linear_fetch_issue",
    description: "Fetch a Linear issue by identifier, for example BRI-168.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Linear issue identifier, for example BRI-168." }
      },
      required: ["id"]
    }
  },
  {
    name: "linear_update_issue",
    description: "Update a Linear issue title, description, or assignee. Requires LINEAR_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Linear issue identifier, for example BRI-168." },
        title: { type: "string", description: "New issue title." },
        description: { type: "string", description: "New Markdown issue description." },
        assigneeEmail: { type: "string", description: "Email of the assignee." }
      },
      required: ["id"]
    }
  },
  {
    name: "linear_search_issues",
    description: "Search Linear issues by text query. Requires LINEAR_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text." },
        first: { type: "number", description: "Maximum number of issues to return." }
      },
      required: ["query"]
    }
  }
];

function readFileIfExists(path: string): string | null {
  try {
    return require("node:fs").readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function readEnvFileKey(): string | null {
  if (!homeDir) return null;
  const text = readFileIfExists(`${homeDir}/.codex/linear.env`);
  if (!text) return null;

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(LINEAR_API_KEY|LINEAR_API_TOKEN)\s*=\s*(.+?)\s*$/);
    if (!match) continue;
    return match[2].replace(/^['"]|['"]$/g, "");
  }
  return null;
}

function readKeychainKey(): string | null {
  if (!homeDir) return null;
  try {
    const { execFileSync } = require("node:child_process");
    return execFileSync("security", ["find-generic-password", "-s", "LINEAR_API_KEY", "-w"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function apiKey(): string {
  const key = process.env.LINEAR_API_KEY || process.env.LINEAR_API_TOKEN || readEnvFileKey() || readKeychainKey();
  if (!key) {
    throw new Error(
      "Missing LINEAR_API_KEY. Add a Linear personal API key to the MCP server environment, ~/.codex/linear.env, or macOS Keychain item LINEAR_API_KEY before using Linear tools."
    );
  }
  return key;
}

async function linearGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey()
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors) {
    const detail = payload.errors?.map((error: any) => error.message).join("; ") || response.statusText;
    throw new Error(`Linear GraphQL request failed: ${detail}`);
  }
  return payload.data as T;
}

async function findIssue(identifier: string) {
  const data = await linearGraphql<{
    issue: null | {
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      url: string;
      branchName: string | null;
      assignee: null | { id: string; name: string; email: string | null };
      creator: null | { id: string; name: string; email: string | null };
      team: { id: string; key: string; name: string };
      state: { id: string; name: string; type: string };
    };
  }>(
    `query Issue($id: String!) {
      issue(id: $id) {
        id identifier title description url branchName
        assignee { id name email }
        creator { id name email }
        team { id key name }
        state { id name type }
      }
    }`,
    { id: identifier }
  );

  if (!data.issue) throw new Error(`Linear issue not found: ${identifier}`);
  return data.issue;
}

async function findUserIdByEmail(email: string): Promise<string> {
  const data = await linearGraphql<{ users: { nodes: Array<{ id: string; email: string; name: string }> } }>(
    `query Users($filter: UserFilter) {
      users(filter: $filter, first: 5) { nodes { id email name } }
    }`,
    { filter: { email: { eq: email } } }
  );
  const user = data.users.nodes[0];
  if (!user) throw new Error(`Linear user not found for email: ${email}`);
  return user.id;
}

async function callTool(name: string, args: any) {
  if (name === "linear_fetch_issue") {
    return { content: [{ type: "text", text: JSON.stringify(await findIssue(args.id), null, 2) }] };
  }

  if (name === "linear_search_issues") {
    const data = await linearGraphql<{ issues: { nodes: any[] } }>(
      `query SearchIssues($query: String!, $first: Int!) {
        issues(filter: { searchableContent: { containsIgnoreCase: $query } }, first: $first, orderBy: updatedAt) {
          nodes { id identifier title url branchName updatedAt state { name type } assignee { name email } }
        }
      }`,
      { query: args.query, first: Math.min(Math.max(Number(args.first || 10), 1), 50) }
    );
    return { content: [{ type: "text", text: JSON.stringify(data.issues.nodes, null, 2) }] };
  }

  if (name === "linear_update_issue") {
    const issue = await findIssue(args.id);
    const input: Record<string, unknown> = {};
    if (typeof args.title === "string") input.title = args.title;
    if (typeof args.description === "string") input.description = args.description;
    if (typeof args.assigneeEmail === "string") input.assigneeId = await findUserIdByEmail(args.assigneeEmail);

    if (Object.keys(input).length === 0) {
      throw new Error("No update fields provided. Pass title, description, or assigneeEmail.");
    }

    const data = await linearGraphql<{ issueUpdate: { success: boolean; issue: any } }>(
      `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue { id identifier title description url branchName assignee { name email } }
        }
      }`,
      { id: issue.id, input }
    );
    return { content: [{ type: "text", text: JSON.stringify(data.issueUpdate.issue, null, 2) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
}

function send(message: JsonRpcResponse | Record<string, unknown>) {
  const payload = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`);
}

async function handle(request: JsonRpcRequest) {
  const id = request.id ?? null;
  try {
    switch (request.method) {
      case "initialize":
        send({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion,
            capabilities: { tools: {} },
            serverInfo: { name: "brids-linear-mcp", version: "1.0.0" }
          }
        });
        return;
      case "notifications/initialized":
        return;
      case "tools/list":
        send({ jsonrpc: "2.0", id, result: { tools } });
        return;
      case "tools/call": {
        const result = await callTool(request.params?.name, request.params?.arguments || {});
        send({ jsonrpc: "2.0", id, result });
        return;
      }
      case "ping":
        send({ jsonrpc: "2.0", id, result: {} });
        return;
      default:
        send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${request.method}` } });
    }
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message: error instanceof Error ? error.message : String(error) }
    });
  }
}

let buffer = Buffer.alloc(0);

function consumeBuffer() {
  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf("\r\n\r\n");

    if (headerEnd !== -1) {
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        send({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Missing Content-Length header" } });
        buffer = Buffer.alloc(0);
        return;
      }

      const length = Number(match[1]);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + length;
      if (buffer.length < messageEnd) return;

      const payload = buffer.slice(messageStart, messageEnd).toString("utf8");
      buffer = buffer.slice(messageEnd);
      try {
        void handle(JSON.parse(payload));
      } catch {
        send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      }
      continue;
    }

    const newline = buffer.indexOf("\n");
    if (newline === -1) return;

    const line = buffer.slice(0, newline).toString("utf8").trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    try {
      void handle(JSON.parse(line));
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    }
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
  consumeBuffer();
});
