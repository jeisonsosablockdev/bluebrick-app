const { execFileSync } = require("node:child_process");

const LINEAR_GRAPHQL_ENDPOINT = process.env.LINEAR_GRAPHQL_ENDPOINT || "https://api.linear.app/graphql";

const STATE_TARGETS = {
  start: {
    label: "In Progress",
    category: "started"
  },
  review: {
    label: "In Review",
    category: "started"
  },
  done: {
    label: "Done",
    category: "completed"
  }
};

function normalizeIssueKey(rawIssueKey) {
  const value = String(rawIssueKey ?? "").trim().toUpperCase();

  if (!value) {
    throw new Error("A Linear issue key is required (example: BRI-149).");
  }

  if (!/^[A-Z]+-\d+$/.test(value)) {
    throw new Error(`Invalid Linear issue key: ${rawIssueKey}. Use the form BRI-149 or EPIC-011.`);
  }

  return value;
}

function normalizeStateCommand(rawState) {
  const value = String(rawState ?? "").trim().toLowerCase().replace(/[_\s-]+/g, "-");

  if (["start", "started", "inprogress", "in-progress"].includes(value)) {
    return "start";
  }

  if (["review", "inreview", "in-review", "ready-for-review", "ready-for-merge"].includes(value)) {
    return "review";
  }

  if (["done", "complete", "completed"].includes(value)) {
    return "done";
  }

  throw new Error(
    `Invalid Linear status command: ${rawState}. Use start, review, or done (aliases: In Progress, In Review, Done).`
  );
}

function parseIssueKeyFromBranchName(branchName) {
  const value = String(branchName ?? "").trim();
  const match = value.match(/([A-Z]+-\d+)/);
  return match ? match[1] : "";
}

function runGit(args, cwd = process.cwd()) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8"
  }).trim();
}

function getGitConfigValue(key, cwd = process.cwd()) {
  try {
    return runGit(["config", "--get", key], cwd);
  } catch {
    return "";
  }
}

function resolveIssueKeyFromContext({ issueKey, branchName, cwd = process.cwd() } = {}) {
  if (issueKey) {
    return normalizeIssueKey(issueKey);
  }

  const currentBranch = String(branchName || runGit(["branch", "--show-current"], cwd) || "").trim();
  if (!currentBranch) {
    throw new Error("Unable to determine the current branch. Pass --issue explicitly.");
  }

  const directConfigKey = getGitConfigValue(`branch.${currentBranch}.linearIssueKey`, cwd);
  if (directConfigKey) {
    return normalizeIssueKey(directConfigKey);
  }

  const parentWorkBranch = getGitConfigValue(`branch.${currentBranch}.parentWorkBranch`, cwd);
  if (parentWorkBranch) {
    const parentConfigKey = getGitConfigValue(`branch.${parentWorkBranch}.linearIssueKey`, cwd);
    if (parentConfigKey) {
      return normalizeIssueKey(parentConfigKey);
    }
  }

  const parsed = parseIssueKeyFromBranchName(currentBranch);
  if (parsed) {
    return normalizeIssueKey(parsed);
  }

  if (parentWorkBranch) {
    const parsedParent = parseIssueKeyFromBranchName(parentWorkBranch);
    if (parsedParent) {
      return normalizeIssueKey(parsedParent);
    }
  }

  throw new Error(
    `Unable to resolve a Linear issue key from branch '${currentBranch}'. Store branch.<name>.linearIssueKey in git config or pass --issue.`
  );
}

function buildStateQueryDocument() {
  return `
    query LinearIssueStatus($issueId: String!) {
      issue(id: $issueId) {
        id
        identifier
        title
        team {
          id
          name
          startedStates: states(filter: { type: { eq: "started" } }) {
            nodes {
              id
              name
              position
            }
          }
          completedStates: states(filter: { type: { eq: "completed" } }) {
            nodes {
              id
              name
              position
            }
          }
        }
      }
    }
  `;
}

function buildStateMutationDocument() {
  return `
    mutation LinearIssueStatusUpdate($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
        issue {
          id
          identifier
          title
          state {
            id
            name
          }
        }
      }
    }
  `;
}

function selectStateNode(nodes, expectedLabel, category, issueIdentifier, teamName) {
  const stateNodes = Array.isArray(nodes) ? nodes : [];
  const exact = stateNodes.find((node) => String(node?.name ?? "").trim() === expectedLabel);

  if (exact && exact.id) {
    return exact;
  }

  const available = stateNodes.map((node) => String(node?.name ?? "").trim()).filter(Boolean);
  throw new Error(
    `Linear team '${teamName || "unknown"}' does not expose a '${expectedLabel}' state in the '${category}' category for issue ${issueIdentifier}. Available states: ${available.join(", ") || "none"}.`
  );
}

async function linearGraphQLRequest({ apiKey, query, variables, endpoint = LINEAR_GRAPHQL_ENDPOINT, fetchImpl = globalThis.fetch }) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available in this runtime.");
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Linear API request failed (${response.status}): ${JSON.stringify(payload || { error: "no-json-body" })}`
    );
  }

  if (payload?.errors?.length) {
    const message = payload.errors.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(`Linear API returned errors: ${message || "unknown error"}`);
  }

  return payload?.data;
}

async function updateLinearIssueStatus({
  issueKey,
  branchName,
  stateCommand,
  cwd = process.cwd(),
  apiKey = process.env.LINEAR_API_KEY,
  endpoint = LINEAR_GRAPHQL_ENDPOINT,
  fetchImpl = globalThis.fetch,
  logger = console
} = {}) {
  if (!apiKey) {
    logger?.info?.("ℹ️ Linear auto-status sync skipped: LINEAR_API_KEY is not configured.");
    return { skipped: true, reason: "missing-api-key" };
  }

  if (String(process.env.LINEAR_AUTOSTATUS ?? "1") === "0") {
    logger?.info?.("ℹ️ Linear auto-status sync skipped: LINEAR_AUTOSTATUS=0.");
    return { skipped: true, reason: "disabled" };
  }

  let normalizedIssueKey;
  try {
    normalizedIssueKey = resolveIssueKeyFromContext({ issueKey, branchName, cwd });
  } catch (error) {
    logger?.info?.(`ℹ️ Linear auto-status sync skipped: ${error.message}`);
    return { skipped: true, reason: "issue-key-unresolved" };
  }
  const normalizedStateCommand = normalizeStateCommand(stateCommand);
  const target = STATE_TARGETS[normalizedStateCommand];
  const issueData = await linearGraphQLRequest({
    apiKey,
    endpoint,
    fetchImpl,
    query: buildStateQueryDocument(),
    variables: {
      issueId: normalizedIssueKey
    }
  });

  const issue = issueData?.issue;
  if (!issue) {
    throw new Error(`Linear issue not found: ${normalizedIssueKey}`);
  }

  const team = issue.team;
  if (!team) {
    throw new Error(`Linear issue ${normalizedIssueKey} does not have a team attached.`);
  }

  const stateContainer =
    target.category === "completed" ? team.completedStates?.nodes : team.startedStates?.nodes;
  const selectedState = selectStateNode(
    stateContainer,
    target.label,
    target.category,
    issue.identifier || normalizedIssueKey,
    team.name
  );

  const updateData = await linearGraphQLRequest({
    apiKey,
    endpoint,
    fetchImpl,
    query: buildStateMutationDocument(),
    variables: {
      issueId: normalizedIssueKey,
      stateId: selectedState.id
    }
  });

  const updatedIssue = updateData?.issueUpdate?.issue;
  if (!updatedIssue) {
    throw new Error(`Linear issue status update failed for ${normalizedIssueKey}.`);
  }

  logger?.info?.(
    `✅ Linear issue ${updatedIssue.identifier || normalizedIssueKey} moved to ${updatedIssue.state?.name || target.label}.`
  );

  return {
    issueId: normalizedIssueKey,
    stateName: updatedIssue.state?.name || target.label,
    skipped: false
  };
}

module.exports = {
  buildStateMutationDocument,
  buildStateQueryDocument,
  getGitConfigValue,
  linearGraphQLRequest,
  normalizeIssueKey,
  normalizeStateCommand,
  parseIssueKeyFromBranchName,
  resolveIssueKeyFromContext,
  selectStateNode,
  updateLinearIssueStatus
};
