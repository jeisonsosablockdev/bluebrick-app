import fs from 'fs';
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

// Read the full markdown file
const filePath = '/Users/camiloz/Documents/MyDocuments/Cz/Proyectos Cz/BRIDS/Development/BRIDS-Solana/repo/docs/features/feature-czambrano-bri-168-ui-ux-fixes-and-improvements-implementation.md';
const fullDescription = fs.readFileSync(filePath, 'utf8');

console.log('Read markdown, length:', fullDescription.length);

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

// 2. update description with full markdown content
const updateMutation = `
mutation UpdateIssue($id: String!, $description: String) {
  issueUpdate(id: $id, input: { description: $description }) {
    success
    issue { id identifier url }
  }
}
`;

const result = await gql(updateMutation, { id: issue.id, description: fullDescription });
console.log('Restored full BRI-168:', result.issueUpdate.issue.identifier, result.issueUpdate.issue.url);