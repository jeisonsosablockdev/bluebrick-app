export interface ParsedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseArrayValue(rawValue: string): string[] {
  const inner = rawValue.slice(1, -1).trim();
  if (inner.length === 0) {
    return [];
  }
  return inner
    .split(",")
    .map((part) => part.trim().replace(/^['\"]|['\"]$/g, ""))
    .filter(Boolean);
}

function parseScalarValue(rawValue: string): unknown {
  const value = rawValue.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    return parseArrayValue(value);
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return value.replace(/^['\"]|['\"]$/g, "");
}

function parseFrontmatterBlock(block: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex <= 0) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    result[key] = parseScalarValue(rawValue);
  }

  return result;
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  if (!source.startsWith("---\n")) {
    throw new Error("Missing frontmatter opening delimiter");
  }

  const endDelimiter = "\n---\n";
  const endIndex = source.indexOf(endDelimiter);
  if (endIndex < 0) {
    throw new Error("Missing frontmatter closing delimiter");
  }

  const frontmatterBlock = source.slice(4, endIndex);
  const body = source.slice(endIndex + endDelimiter.length);

  return {
    frontmatter: parseFrontmatterBlock(frontmatterBlock),
    body
  };
}
