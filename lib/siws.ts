export type SiwsPayload = {
  domain: string;
  publicKey: string;
  nonce: string;
  issuedAt: string;
  statement: string;
};

export function buildSiwsMessage(payload: SiwsPayload): string {
  return [
    "Sign-In With Solana",
    `Domain: ${payload.domain}`,
    `Address: ${payload.publicKey}`,
    `Statement: ${payload.statement}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${payload.issuedAt}`
  ].join("\n");
}

export function parseSiwsMessage(message: string): SiwsPayload | null {
  const lines = message.split("\n");

  if (lines.length !== 6 || lines[0] !== "Sign-In With Solana") {
    return null;
  }

  const domain = parseLabeledLine(lines[1], "Domain: ");
  const publicKey = parseLabeledLine(lines[2], "Address: ");
  const statement = parseLabeledLine(lines[3], "Statement: ");
  const nonce = parseLabeledLine(lines[4], "Nonce: ");
  const issuedAt = parseLabeledLine(lines[5], "Issued At: ");

  if (!domain || !publicKey || !statement || !nonce || !issuedAt) {
    return null;
  }

  return { domain, publicKey, statement, nonce, issuedAt };
}

function parseLabeledLine(line: string, prefix: string): string | null {
  if (!line.startsWith(prefix)) {
    return null;
  }

  const value = line.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

