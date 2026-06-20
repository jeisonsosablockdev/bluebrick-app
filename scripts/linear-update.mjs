import fetch from 'node-fetch';

const API_KEY = process.env.LINEAR_API_KEY;
const ENDPOINT = 'https://api.linear.app/graphql';

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// 1. Get issue BRI-168
const issueQuery = `
query GetIssue($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    team { id key }
  }
}
`;
const { issue } = await gql(issueQuery, { id: 'BRI-168' });
console.log('Fetched issue:', issue.identifier, issue.title);

// Build new description for BRI-168 removing SPEC02,04,06,07
// We'll assume description contains lines with SPEC02 etc. We'll filter them out.
const lines = issue.description.split('\n');
const filtered = lines.filter(l => {
  const lower = l.toLowerCase();
  return !lower.includes('spec02') && !lower.includes('spec04') && !lower.includes('spec06') && !lower.includes('spec07');
});
const newDescription = filtered.join('\n');

// 2. Update issue BRI-168
const updateMutation = `
mutation UpdateIssue($id: String!, $description: String) {
  issueUpdate(id: $id, input: { description: $description }) {
    success
    issue { id identifier }
  }
}
`;
await gql(updateMutation, { id: issue.id, description: newDescription });
console.log('Updated BRI-168 description');

// 3. Create new issue for part 2
const createMutation = `
mutation CreateIssue($teamId: String!, $title: String!, $description: String) {
  issueCreate(input: { teamId: $teamId, title: $title, description: $description }) {
    success
    issue { id identifier url }
  }
}
`;
const newTitle = 'BRI-168 Part 2 — UI/UX Fixes and Improvements (Specs 02,04,06,07)';
const newIssueDescription = `# BRI-168 Part 2 — UI/UX Fixes and Improvements (Specs 02,04,06,07)

## Feature Overview
Continuation of BRI-168 focusing on the remaining SPECs:
- **SPEC02 – Investment Category Iconography**
- **SPEC04 – Hero Dropdown Visual System**
- **SPEC06 – Scroll Motion Experience**
- **SPEC07 – Marketplace Pins Secondary Scope**

Each SPEC will be developed in its own branch following the same SPEC workflow.

## SPEC Traceability
| SPEC | Branch | Status | Scope |
|------|--------|--------|-------|
| SPEC02 – Investment Category Iconography | SPEC/czambrano-bri168-spec02-investment-category-iconography | ⏳ Planned | Custom icon set for investment categories, replace generic iconography |
| SPEC04 – Hero Dropdown Visual System | SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system | ⏳ Planned | Extend hero visual treatment to dropdown (blur, shadows, states, keyboard accessibility) |
| SPEC06 – Scroll Motion Experience | SPEC/czambrano-bri168-spec06-scroll-motion-experience | ⏳ Planned | Progressive scroll animations (Motion/Open Design), reduced-motion fallback |
| SPEC07 – Marketplace Pins Secondary Scope | SPEC/czambrano-bri168-spec07-marketplace-pins-secondary | ⏳ Planned | Pin visibility/hierarchy, state sync map/list/detail, responsive QA |

## BRI-168 Progress (overall)
- ✅ SPEC01 – Landing Dark Hero Look & Feel
- ✅ SPEC03 – Dark Mode Modules Depth
- ✅ SPEC05 – Landing Header Full Width Visual
- ⏳ SPEC02 – Investment Category Iconography *(this issue)*
- ⏳ SPEC04 – Hero Dropdown Visual System *(this issue)*
- ⏳ SPEC06 – Scroll Motion Experience *(this issue)*
- ⏳ SPEC07 – Marketplace Pins Secondary Scope *(this issue)`

## Implementation Notes
- Follow same SPEC workflow: documentation slice → delivery slices → delivery → SPEC MERGE → Feature merge.
- Maintain bilingual (ES/EN) artifacts.
- Update SPEC DEVELOPMENT HISTORY in the implementation artifact.

## Validation
- Visual QA per SPEC.
- \`npm run lint\`, \`npm run typecheck\`, \`npm run validate\` before closing each SPEC.
`;

const result = await gql(createMutation, {
  teamId: issue.team.id,
  title: newTitle,
  description: newIssueDescription,
});
console.log('Created new issue:', result.issueCreate.issue.identifier, result.issueCreate.issue.url);