const fs = require("node:fs/promises");
const path = require("node:path");

const TEMPLATE_RELATIVE_PATH = path.join(
  "docs",
  "templates",
  "linear-single-issue-slices.template.md"
);

const ALLOWED_TYPES = new Set(["feature", "fix", "security", "nft", "refactor"]);
const ALLOWED_SCOPES = new Set([
  "program",
  "app",
  "shared",
  "docs",
  "infra",
  "security",
  "nft"
]);

function slugify(rawValue) {
  return String(rawValue ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function normalizeIssueId(rawIssueId) {
  const value = String(rawIssueId ?? "").trim().toUpperCase();

  if (!value) {
    throw new Error("`--issue` is required (example: --issue BRI-149).");
  }

  if (/^\d+$/.test(value)) {
    return `BRI-${value}`;
  }

  if (/^[A-Z]+-\d+$/.test(value)) {
    return value;
  }

  throw new Error("`--issue` must look like BRI-149 or 149.");
}

function normalizeType(rawType) {
  const value = String(rawType ?? "").trim().toLowerCase();

  if (!ALLOWED_TYPES.has(value)) {
    throw new Error(
      `\`--type\` must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}.`
    );
  }

  return value;
}

function normalizeScope(rawScope) {
  const value = String(rawScope ?? "").trim().toLowerCase();

  if (!ALLOWED_SCOPES.has(value)) {
    throw new Error(
      `\`--scope\` must be one of: ${Array.from(ALLOWED_SCOPES).join(", ")}.`
    );
  }

  return value;
}

function normalizeSliceId(rawSliceId) {
  const value = String(rawSliceId ?? "").trim().toUpperCase().replace(/^S/, "");

  if (!/^\d+$/.test(value)) {
    throw new Error("Slice id must be numeric or start with S (example: S01).");
  }

  return `S${value.padStart(2, "0")}`;
}

function buildInitiativeBranchName({ slug, issueId }) {
  const parentSlug = slugify(slug);
  const normalizedIssueId = normalizeIssueId(issueId).toLowerCase();

  if (!parentSlug) {
    throw new Error("A non-empty slug is required to build Linear initiative branches.");
  }

  return `initiative/${normalizedIssueId}-${parentSlug}`;
}

function buildSliceBranchName({ type, scope, slug, issueId, sliceId, sliceSlug }) {
  const normalizedType = normalizeType(type);
  const normalizedScope = normalizeScope(scope);
  const parentSlug = slugify(slug);
  const normalizedIssueId = normalizeIssueId(issueId).toLowerCase();
  const normalizedSliceId = normalizeSliceId(sliceId).toLowerCase();
  const normalizedSliceSlug = slugify(sliceSlug);

  if (!parentSlug) {
    throw new Error("A non-empty slug is required to build slice branches.");
  }

  if (!normalizedSliceSlug) {
    throw new Error("A non-empty slice slug is required to build slice branches.");
  }

  return `${normalizedType}/${normalizedScope}-${parentSlug}-${normalizedIssueId}-${normalizedSliceId}-${normalizedSliceSlug}`;
}

function buildProblemArtifactPath({ type, slug }) {
  const normalizedType = normalizeType(type);
  const normalizedSlug = slugify(slug);

  if (!normalizedSlug) {
    throw new Error("A non-empty slug is required to build artifact paths.");
  }

  if (normalizedType === "fix") {
    return `docs/fixes/fix-${normalizedSlug}.md`;
  }

  return `docs/features/feature-${normalizedSlug}.md`;
}

function buildSolutionArtifactPath({ type, slug }) {
  const normalizedType = normalizeType(type);
  const normalizedSlug = slugify(slug);

  if (!normalizedSlug) {
    throw new Error("A non-empty slug is required to build artifact paths.");
  }

  if (normalizedType === "fix") {
    return `docs/fixes/fix-${normalizedSlug}-implementation.md`;
  }

  return `docs/features/feature-${normalizedSlug}-implementation.md`;
}

function renderBulletList(items, fallback = "- TBD") {
  if (!items || items.length === 0) {
    return fallback;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function renderOrderedList(items, fallback = "1. TBD") {
  if (!items || items.length === 0) {
    return fallback;
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function parseSliceDefinition(rawSliceDefinition) {
  const parts = String(rawSliceDefinition ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3 || parts.length > 5) {
    throw new Error(
      "Each `--slice` must use `S01|Objective|Scope tecnico|Validation` or `S01|slice-slug|Objective|Scope tecnico|Validation`."
    );
  }

  if (parts.length === 3) {
    const [sliceId, objective, technicalScope] = parts;
    return {
      sliceId,
      sliceSlug: slugify(objective),
      objective,
      technicalScope,
      validation: "npm run validate"
    };
  }

  if (parts.length === 4) {
    const [sliceId, objective, technicalScope, validation] = parts;
    return {
      sliceId,
      sliceSlug: slugify(objective),
      objective,
      technicalScope,
      validation
    };
  }

  const [sliceId, sliceSlug, objective, technicalScope, validation] = parts;
  return {
    sliceId,
    sliceSlug,
    objective,
    technicalScope,
    validation
  };
}

function parseArgs(argv) {
  const args = {
    issueId: "",
    type: "feature",
    scope: "",
    slug: "",
    title: "",
    goal: "",
    scopeItems: [],
    nonGoals: [],
    risks: [],
    slices: [],
    testPlanFirst: [],
    owner: process.env.USER || process.env.USERNAME || "unknown",
    bodyFile: "",
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    const next = argv[index + 1];

    if (
      token === "--issue" ||
      token === "--type" ||
      token === "--scope" ||
      token === "--slug" ||
      token === "--title" ||
      token === "--goal" ||
      token === "--scope-item" ||
      token === "--non-goal" ||
      token === "--risk" ||
      token === "--slice" ||
      token === "--test-plan-first" ||
      token === "--owner" ||
      token === "--body-file"
    ) {
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${token}.`);
      }

      if (token === "--issue") args.issueId = next;
      if (token === "--type") args.type = next;
      if (token === "--scope") args.scope = next;
      if (token === "--slug") args.slug = next;
      if (token === "--title") args.title = next;
      if (token === "--goal") args.goal = next;
      if (token === "--scope-item") args.scopeItems.push(next);
      if (token === "--non-goal") args.nonGoals.push(next);
      if (token === "--risk") args.risks.push(next);
      if (token === "--slice") args.slices.push(next);
      if (token === "--test-plan-first") args.testPlanFirst.push(next);
      if (token === "--owner") args.owner = next;
      if (token === "--body-file") args.bodyFile = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

async function readTemplate(rootDir) {
  const templatePath = path.join(rootDir, TEMPLATE_RELATIVE_PATH);

  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(
      `Linear slice plan template not found. Expected file: ${TEMPLATE_RELATIVE_PATH}`
    );
  }

  return {
    templatePath,
    templateContent: await fs.readFile(templatePath, "utf8")
  };
}

function renderSliceRows({ slices, type, scope, slug, issueId }) {
  return slices
    .map((slice) => {
      const sliceBranch = buildSliceBranchName({
        type,
        scope,
        slug,
        issueId,
        sliceId: slice.sliceId,
        sliceSlug: slice.sliceSlug
      });

      return `| ${normalizeSliceId(slice.sliceId)} | todo | \`${sliceBranch}\` | ${slice.objective} | ${slice.technicalScope} | ${slice.validation} | TBD |`;
    })
    .join("\n");
}

function buildGitCommandSummary({ initiativeBranch, sliceBranches }) {
  const lines = [
    "Linear initiative branch:",
    `  git checkout develop`,
    `  git pull --ff-only origin develop`,
    `  git checkout -b ${initiativeBranch}`,
    "",
    "Slice branches:"
  ];

  sliceBranches.forEach((slice) => {
    lines.push(`  # ${slice.sliceId} - ${slice.objective}`);
    lines.push(`  git checkout ${initiativeBranch}`);
    lines.push(`  git checkout -b ${slice.branch}`);
  });

  return lines.join("\n");
}

async function createLinearPlan(options) {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();
  const { templateContent } = await readTemplate(rootDir);

  const issueId = normalizeIssueId(options.issueId);
  const type = normalizeType(options.type);
  const scope = normalizeScope(options.scope);
  const slug = slugify(options.slug || options.title);
  const title = String(options.title ?? "").trim();
  const goal = String(options.goal ?? "").trim();
  const owner = String(options.owner ?? "unknown").trim() || "unknown";

  if (!slug) {
    throw new Error("`--slug` is required (example: --slug wallet-session-hardening).");
  }

  if (!title) {
    throw new Error("`--title` is required.");
  }

  if (!goal) {
    throw new Error("`--goal` is required.");
  }

  if (!Array.isArray(options.slices) || options.slices.length === 0) {
    throw new Error("At least one `--slice` entry is required.");
  }

  const parsedSlices = options.slices.map(parseSliceDefinition);
  const firstSlice = parsedSlices[0];
  const initiativeBranch = buildInitiativeBranchName({
    slug,
    issueId
  });
  const problemArtifact = buildProblemArtifactPath({ type, slug });
  const solutionArtifact = buildSolutionArtifactPath({ type, slug });

  if (normalizeSliceId(firstSlice.sliceId) !== "S01") {
    throw new Error("The first slice must be S01 so the spec slice owns the plan first.");
  }

  const sliceBranches = parsedSlices.map((slice) => ({
    sliceId: normalizeSliceId(slice.sliceId),
    objective: slice.objective,
    branch: buildSliceBranchName({
      type,
      scope,
      slug,
      issueId,
      sliceId: slice.sliceId,
      sliceSlug: slice.sliceSlug
    })
  }));

  const body = templateContent
    .replace("{{GOAL}}", goal)
    .replace("{{SCOPE_ITEMS}}", renderBulletList(options.scopeItems))
    .replace("{{NON_GOAL_ITEMS}}", renderBulletList(options.nonGoals))
    .replace("{{ISSUE_ID}}", issueId)
    .replace("{{OWNER}}", owner)
    .replace("{{PROBLEM_ARTIFACT}}", problemArtifact)
    .replace("{{SOLUTION_ARTIFACT}}", solutionArtifact)
    .replace("{{INITIATIVE_BRANCH}}", initiativeBranch)
    .replace("{{DOCUMENTATION_SLICE_BRANCH}}", sliceBranches[0].branch)
    .replace("{{DOCUMENTATION_SLICE_OBJECTIVE}}", firstSlice.objective)
    .replace(
      "{{SLICE_ROWS}}",
      renderSliceRows({
        slices: parsedSlices,
        type,
        scope,
        slug,
        issueId
      })
    )
    .replace(
      "{{EXECUTION_ORDER}}",
      renderOrderedList(
        parsedSlices.map((slice) => `${normalizeSliceId(slice.sliceId)} - ${slice.objective}`)
      )
    )
    .replace("{{RISK_ITEMS}}", renderBulletList(options.risks))
    .replace(
      "{{TEST_PLAN_FIRST_ITEMS}}",
      renderBulletList(
        options.testPlanFirst,
        "- Define tests-first expectations for each slice before delivery starts."
      )
    )
    .replace(
      "{{COMPLETION_GATE_ITEMS}}",
      [
        "- [ ] All slice branches merged into the Linear initiative branch",
        "- [ ] `npm run validate`",
        "- [ ] Required docs updated for the touched scope",
        "- [ ] Parent issue links the merged PRs and final commit path",
        "- [ ] Final PR opened from the Linear initiative branch into `develop`"
      ].join("\n")
    );

  return {
    body,
    initiativeBranch,
    issueId,
    sliceBranches,
    commandSummary: buildGitCommandSummary({
      initiativeBranch,
      sliceBranches
    })
  };
}

function usage() {
  return [
    "Generate a single-issue slice plan for Linear and print the branch map.",
    "",
    "Usage:",
    "  npm run linear:plan -- --issue BRI-149 --type feature --scope shared --slug my-feature --title \"My feature\" --goal \"...\" --slice \"S01|Objective|Scope|Validation\"",
    "",
    "Options:",
    "  --issue <BRI-149>        Parent Linear issue identifier",
    "  --type <feature|fix|security|nft|refactor>",
    "  --scope <program|app|shared|docs|infra|security|nft>",
    "  --slug <parent-slug>     Stable slug shared by the Linear initiative and slice branches",
    "  --title <text>           Parent issue title",
    "  --goal <text>            Objective shown in the generated Markdown",
    "  --scope-item <text>      Repeatable scope bullet",
    "  --non-goal <text>        Repeatable non-goal bullet",
    "  --risk <text>            Repeatable risk bullet",
    "  --slice <text>           Repeatable. Use `S01|Objective|Scope tecnico|Validation` or `S01|slice-slug|Objective|Scope tecnico|Validation`",
    "  --test-plan-first <text> Repeatable tests-first bullet for the parent issue plan",
    "  --owner <name>           Owner shown in the Markdown",
    "  --body-file <path>       Optional output path. If omitted, Markdown prints to stdout.",
    "  --help                   Show this help"
  ].join("\n");
}

async function runCli(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(usage());
    return;
  }

  const plan = await createLinearPlan(args);

  if (args.bodyFile) {
    const bodyFilePath = path.resolve(args.bodyFile);
    await fs.writeFile(bodyFilePath, plan.body, "utf8");
    console.log(`Linear slice plan written to ${bodyFilePath}`);
    console.log(`Parent issue: ${plan.issueId}`);
    console.log(`Linear initiative branch: ${plan.initiativeBranch}`);
    console.log("");
    console.log(plan.commandSummary);
    return;
  }

  console.log(plan.body);
}

module.exports = {
  buildInitiativeBranchName,
  buildProblemArtifactPath,
  buildSliceBranchName,
  buildSolutionArtifactPath,
  createLinearPlan,
  normalizeIssueId,
  normalizeScope,
  normalizeSliceId,
  normalizeType,
  parseArgs,
  parseSliceDefinition,
  runCli,
  slugify,
  usage
};
