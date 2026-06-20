import { execFileSync } from 'node:child_process';

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.error('LINEAR_API_KEY not set');
  process.exit(1);
}

async function gql(query, variables = {}) {
  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('\n'));
  return json.data;
}

// 1. fetch BRI-168
const issueQuery = `
query Issue($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    team { id }
  }
}
`;
const issueData = await gql(issueQuery, { id: 'BRI-168' });
const issue = issueData.issue;
if (!issue) throw new Error('BRI-168 not found');
console.log('Found', issue.identifier);

// 2. updated description
const updatedDescription = `# BRI-168 — UI/UX Fixes and Improvements

## Summary
This feature delivers a progressive redesign of the BRIDS landing experience through a series of scoped SPECs. The work modernizes the visual language (dark‑mode depth, borderless modules, full‑bleed headers), introduces custom investment‑category iconography, adds scroll‑driven motion, and improves marketplace pin usability. Each SPEC is developed in isolation, validated locally, then merged internally to the Feature branch without intermediate PRs.

---

## SPEC Traceability

| SPEC | Branch | Status | Scope |
|------|--------|--------|-------|
| **SPEC01** – Landing Dark Hero Look & Feel | \`SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel\` | ✅ Merged | Dark‑mode hero background, gaussian blur, blue/purple glow, borderless internal panels |
| **SPEC02** – Investment Category Iconography | \`SPEC/czambrano-bri168-spec02-investment-category-iconography\` | ⏳ Planned | Custom icon set for investment categories, replace generic iconography |
| **SPEC03** – Dark Mode Modules Depth | \`SPEC/czambrano-bri168-spec03-dark-mode-modules-depth\` | ✅ Merged | Remove white borders from cards/modules; introduce soft shadows, gradients, dark glass; applied to landing, marketplace, transparencia |
| **SPEC04** – Hero Dropdown Visual System | \`SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system\` | ⏳ Planned | Extend hero visual treatment to dropdown (blur, shadows, states, keyboard accessibility) |
| **SPEC05** – Landing Header Full Width Visual | \`SPEC/czambrano-bri168-spec05-landing-header-full-width-visual\` | ✅ **This PR** | Full‑bleed header (horizontal + vertical to viewport top); left‑aligned copy & CTAs at ~¼ viewport; stats grid preserved; rounded corners & room image removed |
| **SPEC06** – Scroll Motion Experience | \`SPEC/czambrano-bri168-spec06-scroll-motion-experience\` | ⏳ Planned | Progressive scroll animations (Motion/Open Design), reduced‑motion fallback |
| **SPEC07** – Marketplace Pins Secondary Scope | \`SPEC/czambrano-bri168-spec07-marketplace-pins-secondary\` | ⏳ Planned | Pin visibility/hierarchy, state sync map/list/detail, responsive QA |

---

## BRI‑168 Progress

- ✅ **SPEC01** – Landing Dark Hero Look & Feel  
- ✅ **SPEC03** – Dark Mode Modules Depth  
- ✅ **SPEC05** – Landing Header Full Width Visual *(delivered in this PR)*  
- ⏳ SPEC02 – Investment Category Iconography  
- ⏳ SPEC04 – Hero Dropdown Visual System  
- ⏳ SPEC06 – Scroll Motion Experience  
- ⏳ SPEC07 – Marketplace Pins Secondary Scope  

---

## Implementation Notes (SPEC05)

- \`.landing-hero-shell\` in \`app/globals.css\`: negative margins \`calc(-50vw + 50%)\` for full‑width horizontal bleed; \`margin-top: -100vh\` + \`padding-top: calc(100vh + offset)\` for vertical bleed to viewport top.
- \`components/sections/hero.tsx\`: flex layout, content left‑aligned in \`max-w-2xl\` (~¼ viewport), spacer right, stats grid unchanged.
- \`app/page.tsx\`: \`main\` gets \`pt-0\` so hero starts at viewport top.
- Removed rounded corners (\`rounded-[2rem]\`) and room image panel.
- Responsive padding scale: 1.5 rem → 6 rem across breakpoints.
- CSS syntax fix: duplicate \`margin-right\` removed (commit 932e84c).

---

## Validation

- Local visual review: header spans full viewport top‑edge, gradients scroll with parallax, copy/CTAs left‑aligned at ~¼ viewport, stats grid unchanged.
- Responsive breakpoints verified (320 px, 375 px, 768 px, 1024 px, 1440 px, 1920 px).
- \`npm run lint\`, \`npm run typecheck\`, \`npm run validate\` all green.
- Documentation updated: \`docs/auth-flow.md\`, \`docs/session-model.md\` (Last Updated 2026‑06‑16), \`docs/knowledge/README.md\` rebuilt, Candy Machine iteration doc added for rebase compliance.

---

## Review Notes

- SPEC→Feature merges are internal (no intermediate PRs) per project protocol; this PR merges the Feature branch into \`develop\`.
- 6 build‑web‑apps skills imported to \`.opencode/skills/\` (frontend‑app‑builder, frontend‑testing‑debugging, react‑best‑practices, shadcn‑best‑practices, stripe‑best‑practices, supabase‑best‑practices) — requires opencode restart.
- All SPECs tracked in Linear (BRI‑168) with bilingual artifacts (ES/EN).
`;

const updateMutation = `
mutation UpdateIssue($id: String!, $description: String) {
  issueUpdate(id: $id, input: { description: $description }) {
    success
    issue { id identifier url }
  }
}
`;

const result = await gql(updateMutation, { id: issue.id, description: updatedDescription });
console.log('Updated BRI-168:', result.issueUpdate.issue.identifier, result.issueUpdate.issue.url);