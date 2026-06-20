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

// Original English body from artifact (lines 144-283)
const originalDescription = `## ENGLISH VERSION

### Status
- Implementation artifact
- Issue: \`BRI-168\`
- Developer: \`czambrano\`
- Primary source: Linear issue body
- Local record: this file
- Main issue branch: \`feature/czambrano-bri-168-ui-ux-fixes-and-improvements\`

### Implementation Direction
The work runs as a series of SPECS inside the same parent issue. Each SPEC must live in Linear first, then be mirrored in the local \`.md\` files, and only then implemented in the repository.

The \`feature/czambrano-bri-168-ui-ux-fixes-and-improvements\` branch is the main \`Feature\` branch for \`BRI-168\`. All issue documentation must be captured in this branch and synchronized with Linear before opening or executing SPEC branches.

SPEC branches use the naming convention \`SPEC/czambrano-bri168-specNN-spec-slug\`. The \`SPEC01\`, \`SPEC02\`, \`SPEC03\` order organizes scope, but execution may prioritize stability, technical dependencies, or integration risk over numeric order.

### Cross-Project Policy Objective
Install these rules into the primary BRIDS policy and workflow documents:
1. Confirm which project developer is responsible before touching Linear.
2. Confirm the issue owner, issue creator, development assignee, and developer identity for comments, Linear activity, and Git commits.
3. Confirm the target issue.
4. Prepare Spanish and English versions.
5. Update the issue body as the primary source.
6. Avoid loose comments for SPECS.
7. Sync local \`.md\` files with the issue body.
8. Use SPEC branches with the format \`SPEC/<developer>-bri<issue>-specNN-<slug>\` when a \`Feature\` branch is divided into multiple SPECS.
9. Document \`SPEC DEVELOPMENT HISTORY\` at the end of the issue with stable outcomes, reusable decisions, and validated learnings by SPEC.
10. Run \`SPEC MERGE\` as the internal closing protocol for each SPEC before integrating into the \`Feature\` branch, without an intermediate PR.

### Implementation SPECS

1. **SPEC01 - Landing Dark Hero Look And Feel**
   - SPEC branch: \`SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel\`
   - Objective: improve the dark mode Hero with a dark blue background, gaussian blur, blue/purple glow, and borderless internal panels.
   - **PROPOSED INITIAL SCOPE:**
     - \`components/sections/hero.tsx\`
     - \`app/globals.css\`
     - Hero dark mode background.
     - Borderless Hero internal panels.
     - Secondary CTA without visible white border.
     - Hero dropdown if it belongs to the same technical flow.
   - **Initial validation:**
     - \`npm run lint\`
     - visual evidence at \`http://localhost:3000\`


2. **SPEC02 - Investment Category Iconography**
   - SPEC branch: \`SPEC/czambrano-bri168-spec02-investment-category-iconography\`
   - Objective: create custom investment category icons and replace generic iconography.
   - **PROPOSED INITIAL SCOPE:**
     - Audit public surfaces with investment categories.
     - Identify current generic icons.
     - Design or implement an initial BRIDS icon set.
     - Validate sizes, visual weights, contrast, and states.
   - **Initial validation:**
     - dark/light mode visual review
     - responsive QA for touched surfaces


3. **SPEC03 - Dark Mode Modules Depth**
   - SPEC branch: \`SPEC/czambrano-bri168-spec03-dark-mode-modules-depth\`
   - Objective: remove white borders from informational modules and introduce clean visual depth.
   - **PROPOSED INITIAL SCOPE:**
     - Audit landing cards and modules.
     - Remove unnecessary white outlines.
     - Apply soft shadows, gradients, and dark glass.
     - Validate contrast and accessibility.
   - **Initial validation:**
     - dark/light mode visual review
     - \`npm run lint\`


4. **SPEC04 - Hero Dropdown Visual System**
   - SPEC branch: \`SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system\`
   - Objective: extend the Hero visual treatment to the dropdown menu.
   - **PROPOSED INITIAL SCOPE:**
     - Identify the exact dropdown component.
     - Apply blue/purple mood, blur, shadows, and depth.
     - Review hover, active, focus, and selected states.
     - Validate keyboard accessibility.
   - **Initial validation:**
     - dropdown interaction QA
     - responsive review


5. **SPEC05 - Landing Header Full Width Visual**
   - SPEC branch: \`SPEC/czambrano-bri168-spec05-landing-header-full-width-visual\`
   - Status: started as the next active SPEC from the Feature branch.
   - Objective: redesign the header/first viewport with full horizontal usage and city/tokenization visual direction.
   - **PROPOSED INITIAL SCOPE:**
     - Audit the current header structure.
     - Propose a full-width composition.
     - Define city, tokenization, and fractionalization imagery or visual direction.
     - Define large-text hierarchy.
   - **Initial validation:**
     - desktop/mobile visual review
     - first viewport performance validation


6. **SPEC06 - Scroll Motion Experience**
   - SPEC branch: \`SPEC/czambrano-bri168-spec06-scroll-motion-experience\`
   - Objective: explore progressive scroll animation using Motion, Open Design, or a current AI engine.
   - **PROPOSED INITIAL SCOPE:**
     - Evaluate animation engine.
     - Define candidate elements for scroll animation.
     - Prototype a minimal animation.
     - Include fallback for \`prefers-reduced-motion\`.
   - **Initial validation:**
     - performance test
     - motion accessibility validation


7. **SPEC07 - Marketplace Pins Secondary Scope**
   - SPEC branch: \`SPEC/czambrano-bri168-spec07-marketplace-pins-secondary\`
   - Objective: resume pin improvements as secondary scope for \`BRI-168\`.
   - **PROPOSED INITIAL SCOPE:**
     - Review pin visibility and hierarchy.
     - Review selected, hover, focus, and active states.
     - Validate map/list/detail synchronization.
     - Run Marketplace responsive QA.
   - **Initial validation:**
     - map/list/detail QA
     - Marketplace responsive QA
### Gates
- Linear updated as primary source.
- Local \`.md\` files are consistent.
- Complete ES/EN bilingual structure.
- No loose Linear SPEC comments.
- Initial scope for each SPEC validated or adjusted by the developer before implementation.
- UI validation per SPEC.
- \`SPEC HISTORY\` updated before each \`SPEC MERGE\`.
- Internal \`SPEC/*\` → \`Feature\` merge completed without an intermediate PR when the responsible developer confirms it.
- \`npm run validate\` before closing the full block.`;

// 1. fetch issue
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
const { issue } = await gql(issueQuery, { id: 'BRI-168' });
if (!issue) throw new Error('BRI-168 not found');
console.log('Found', issue.identifier);

// 2. update description
const updateMutation = `
mutation UpdateIssue($id: String!, $description: String) {
  issueUpdate(id: $id, input: { description: $description }) {
    success
    issue { id identifier url }
  }
}
`;

const result = await gql(updateMutation, { id: issue.id, description: originalDescription });
console.log('Restored BRI-168:', result.issueUpdate.issue.identifier, result.issueUpdate.issue.url);