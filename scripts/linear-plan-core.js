const fs = require("node:fs/promises");
const path = require("node:path");

const TEMPLATE_RELATIVE_PATH = path.join(
  "knowledge",
  "templates",
  "linear-single-issue-slices.template.md"
);

const ALLOWED_TYPES = new Set([
  "feature",
  "bugfix",
  "fix",
  "hotfix",
  "epic",
  "security",
  "nft",
  "refactor"
]);
const FIX_ARTIFACT_TYPES = new Set(["bugfix", "fix", "hotfix"]);
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

function normalizeDeveloperHandle(rawHandle) {
  const value = slugify(rawHandle);

  if (!value) {
    throw new Error("A non-empty `--owner` value is required.");
  }

  return value;
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

function buildFeatureBranchName({ type, owner, slug, issueId }) {
  const normalizedType = normalizeType(type);
  const normalizedOwner = normalizeDeveloperHandle(owner);
  const parentSlug = slugify(slug);
  const normalizedIssueId = normalizeIssueId(issueId);

  if (!parentSlug) {
    throw new Error("A non-empty slug is required to build parent work branches.");
  }

  return `${normalizedType}/${normalizedOwner}-${normalizedIssueId}-${parentSlug}`;
}

function buildSpecBranchName({ owner, issueId, specSlug }) {
  const normalizedOwner = normalizeDeveloperHandle(owner);
  const normalizedIssueId = normalizeIssueId(issueId);
  const normalizedSpecSlug = slugify(specSlug);

  if (!normalizedSpecSlug) {
    throw new Error("A non-empty spec slug is required to build SPEC branches.");
  }

  return `SPEC/${normalizedOwner}-${normalizedIssueId}-${normalizedSpecSlug}`;
}

function buildInitiativeBranchName(options) {
  return buildFeatureBranchName(options);
}

function buildSliceBranchName({ owner, issueId, sliceSlug }) {
  return buildSpecBranchName({
    owner,
    issueId,
    specSlug: sliceSlug
  });
}

function buildProblemArtifactPath({ type, slug }) {
  const normalizedType = normalizeType(type);
  const normalizedSlug = slugify(slug);

  if (!normalizedSlug) {
    throw new Error("A non-empty slug is required to build artifact paths.");
  }

  if (FIX_ARTIFACT_TYPES.has(normalizedType)) {
    return `knowledge/fixes/fix-${normalizedSlug}.md`;
  }

  return `knowledge/features/feature-${normalizedSlug}.md`;
}

function buildSolutionArtifactPath({ type, slug }) {
  const normalizedType = normalizeType(type);
  const normalizedSlug = slugify(slug);

  if (!normalizedSlug) {
    throw new Error("A non-empty slug is required to build artifact paths.");
  }

  if (FIX_ARTIFACT_TYPES.has(normalizedType)) {
    return `knowledge/fixes/fix-${normalizedSlug}-implementation.md`;
  }

  return `knowledge/features/feature-${normalizedSlug}-implementation.md`;
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
    acceptanceCriteria: [],
    openQuestions: [],
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
      token === "--acceptance-criteria" ||
      token === "--open-question" ||
      token === "--risk" ||
      token === "--slice" ||
      token === "--spec" ||
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
      if (token === "--acceptance-criteria") args.acceptanceCriteria.push(next);
      if (token === "--open-question") args.openQuestions.push(next);
      if (token === "--risk") args.risks.push(next);
      if (token === "--slice" || token === "--spec") args.slices.push(next);
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
      `Linear SPEC plan template not found. Expected file: ${TEMPLATE_RELATIVE_PATH}`
    );
  }

  return {
    templatePath,
    templateContent: await fs.readFile(templatePath, "utf8")
  };
}

function renderSliceRows({ slices, issueId }) {
  return slices
    .map((slice) => {
      const sliceBranch = buildSpecBranchName({
        owner: slice.owner,
        issueId,
        specSlug: slice.sliceSlug
      });

      return `| ${normalizeSliceId(slice.sliceId)} | todo | \`${sliceBranch}\` | ${slice.objective} | ${slice.technicalScope} | ${slice.validation} | TBD |`;
    })
    .join("\n");
}

function buildGitCommandSummary({ featureBranch, specBranches }) {
  const lines = [
    "Parent work branch:",
    `  git checkout develop`,
    `  git pull --ff-only origin develop`,
    `  git checkout -b ${featureBranch}`,
    "",
    "SPEC branches:"
  ];

  specBranches.forEach((spec) => {
    lines.push(`  # ${spec.sliceId} - ${spec.objective}`);
    lines.push(`  git checkout ${featureBranch}`);
    lines.push(`  git checkout -b ${spec.branch}`);
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
  const owner = normalizeDeveloperHandle(options.owner ?? "unknown");

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
    throw new Error("At least one `--slice` or `--spec` entry is required.");
  }

  const parsedSpecs = options.slices.map(parseSliceDefinition);
  const firstSpec = parsedSpecs[0];
  const featureBranch = buildFeatureBranchName({
    type,
    owner,
    slug,
    issueId
  });
  const problemArtifact = buildProblemArtifactPath({ type, slug });
  const solutionArtifact = buildSolutionArtifactPath({ type, slug });

  if (normalizeSliceId(firstSpec.sliceId) !== "S01") {
    throw new Error("The first SPEC must be S01 so the planning SPEC owns the plan first.");
  }

  const specBranches = parsedSpecs.map((slice) => ({
    sliceId: normalizeSliceId(slice.sliceId),
    objective: slice.objective,
    branch: buildSpecBranchName({
      owner,
      issueId,
      specSlug: slice.sliceSlug
    })
  }));

  const body = templateContent
    .replace("{{GOAL}}", goal)
    .replace("{{SCOPE_ITEMS}}", renderBulletList(options.scopeItems))
    .replace("{{NON_GOAL_ITEMS}}", renderBulletList(options.nonGoals))
    .replace("{{ACCEPTANCE_CRITERIA_ITEMS}}", renderBulletList(options.acceptanceCriteria))
    .replace("{{OPEN_QUESTIONS_ITEMS}}", renderBulletList(options.openQuestions, "- None"))
    .replace("{{ISSUE_ID}}", issueId)
    .replace("{{OWNER}}", owner)
    .replace("{{PROBLEM_ARTIFACT}}", problemArtifact)
    .replace("{{SOLUTION_ARTIFACT}}", solutionArtifact)
    .replace("{{FEATURE_BRANCH}}", featureBranch)
    .replace("{{FIRST_SPEC_BRANCH}}", specBranches[0].branch)
    .replace("{{SPEC_BRANCH_PATTERN}}", `SPEC/${owner}-${issueId}-<spec-slug>`)
    .replace(
      "{{SPEC_ROWS}}",
      renderSliceRows({
        slices: parsedSpecs.map((slice) => ({
          ...slice,
          owner
        })),
        issueId
      })
    )
    .replace(
      "{{EXECUTION_ORDER}}",
      renderOrderedList(
        parsedSpecs.map((slice) => `${normalizeSliceId(slice.sliceId)} - ${slice.objective}`)
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
        "- [ ] All SPEC branches merged into the parent work branch",
        "- [ ] `npm run validate`",
        "- [ ] Required docs updated for the touched scope",
        "- [ ] Spec/documentation slice used `explain-like-socrates` before delivery slices opened",
        "- [ ] Human Acceptance approved by the user after manual testing before final merge to `develop`",
        "- [ ] Parent issue links the merged PRs and final commit path",
        "- [ ] Final PR opened from the parent work branch into `develop`"
      ].join("\n")
    );

  return {
    body,
    featureBranch,
    issueId,
    specBranches,
    commandSummary: buildGitCommandSummary({
      featureBranch,
      specBranches
    })
  };
}

function usage() {
  return [
    "Generate a single-issue issue-type-driven parent work + SPEC plan for Linear and print the branch map.",
    "",
    "Usage:",
    "  npm run linear:plan -- --issue BRI-149 --type feature --owner czambrano --slug my-feature --title \"My feature\" --goal \"...\" --spec \"S01|Planning SPEC|Scope|Validation\"",
    "",
    "Options:",
    "  --issue <BRI-149>        Parent Linear issue identifier",
    "  --type <feature|bugfix|fix|hotfix|epic|security|nft|refactor>",
    "  --scope <program|app|shared|docs|infra|security|nft>",
    "  --owner <handle>        Lowercase developer handle used in branch names",
    "  --slug <parent-slug>     Stable slug shared by the parent work branch",
    "  --title <text>           Parent issue title",
    "  --goal <text>            Objective shown in the generated Markdown",
    "  --scope-item <text>      Repeatable scope bullet",
    "  --non-goal <text>        Repeatable non-goal bullet",
    "  --acceptance-criteria <text> Repeatable acceptance-criteria bullet",
    "  --open-question <text>   Repeatable open-question bullet",
    "  --risk <text>            Repeatable risk bullet",
    "  --slice <text>           Repeatable. Use `S01|Objective|Scope tecnico|Validation` or `S01|spec-slug|Objective|Scope tecnico|Validation`",
    "  --spec <text>            Alias of --slice for SPEC terminology",
    "  --test-plan-first <text> Repeatable tests-first bullet for the parent issue plan",
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
    console.log(`Linear SPEC plan written to ${bodyFilePath}`);
    console.log(`Parent issue: ${plan.issueId}`);
    console.log(`Parent work branch: ${plan.featureBranch}`);
    console.log("");
    console.log(plan.commandSummary);
    return;
  }

  console.log(plan.body);
}

module.exports = {
  buildInitiativeBranchName,
  buildFeatureBranchName,
  buildProblemArtifactPath,
  buildSliceBranchName,
  buildSpecBranchName,
  buildSolutionArtifactPath,
  createLinearPlan,
  normalizeIssueId,
  normalizeDeveloperHandle,
  normalizeScope,
  normalizeSliceId,
  normalizeType,
  parseArgs,
  parseSliceDefinition,
  runCli,
  slugify,
  usage
};
