type CollectionIdentityInput = {
  slug: string;
  internalCode: string;
};

type CollectionSuggestion = {
  collectionName: string;
  collectionSymbol: string;
};

type MetadataSuggestion = {
  metadataBaseName: string;
  metadataBaseUri: string;
};

type FinancialRuleInput = {
  fundingGoal: string;
  totalUnits: string;
  nftCost: string;
  source: "totalUnits" | "nftCost";
};

type FinancialRuleOutput = {
  fundingGoal: string;
  totalUnits: string;
  nftCost: string;
};

type ParsedTabularRows = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

function normalizeAlphaNumeric(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function titleCaseFromSlug(value: string): string {
  return value
    .trim()
    .replace(/[_\s]+/g, "-")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeHeaderKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

function formatNumberish(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toFixed(8).replace(/\.?0+$/, "");
}

export function suggestCollectionFromIdentity(input: CollectionIdentityInput): CollectionSuggestion {
  const slugTitle = titleCaseFromSlug(input.slug);
  const internalCode = input.internalCode.trim();

  if (!slugTitle && !internalCode) {
    return {
      collectionName: "",
      collectionSymbol: ""
    };
  }

  const symbolSeed = `${normalizeAlphaNumeric(internalCode)}${normalizeAlphaNumeric(input.slug)}`;
  const symbol = symbolSeed.slice(0, 10);

  return {
    collectionName: [internalCode, slugTitle].filter(Boolean).join(" ").trim(),
    collectionSymbol: symbol
  };
}

export function suggestMetadataFromIdentity(input: CollectionIdentityInput): MetadataSuggestion {
  const slug = input.slug.trim();
  const slugTitle = titleCaseFromSlug(slug);
  const internalCode = input.internalCode.trim();
  const baseName = [internalCode, slugTitle].filter(Boolean).join(" ").trim();

  return {
    metadataBaseName: baseName ? `${baseName} #` : "",
    metadataBaseUri: slug ? `https://metadata.example.com/${slug}/` : ""
  };
}

export function applyFinancialRule(input: FinancialRuleInput): FinancialRuleOutput {
  const fundingGoal = parsePositiveNumber(input.fundingGoal);
  if (!fundingGoal) {
    return {
      fundingGoal: input.fundingGoal,
      nftCost: input.nftCost,
      totalUnits: input.totalUnits
    };
  }

  if (input.source === "totalUnits") {
    let totalUnits = parsePositiveInt(input.totalUnits) ?? 1;
    let nftCost = fundingGoal / totalUnits;

    // Never allow zero-cost NFT; clamp by reducing units to funding goal.
    if (nftCost < 1) {
      nftCost = 1;
      totalUnits = Math.max(1, Math.floor(fundingGoal));
    }

    return {
      fundingGoal: input.fundingGoal,
      totalUnits: String(totalUnits),
      nftCost: formatNumberish(nftCost)
    };
  }

  let nftCost = parsePositiveNumber(input.nftCost) ?? 1;
  if (nftCost < 1) {
    nftCost = 1;
  }

  let totalUnits = Math.round(fundingGoal / nftCost);
  if (totalUnits <= 0) {
    totalUnits = 1;
  }

  const adjustedCost = fundingGoal / totalUnits;

  return {
    fundingGoal: input.fundingGoal,
    totalUnits: String(totalUnits),
    nftCost: formatNumberish(adjustedCost)
  };
}

export function parseTabularText(value: string): ParsedTabularRows {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { headers: [], rows: [] };
  }

  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((header) => header.trim()).filter(Boolean);

  const rows = lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((cell) => cell.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  }).filter((row) => Object.values(row).some((valuePart) => valuePart.length > 0));

  return {
    headers,
    rows
  };
}

export function parseTextFileToTabularRows(fileName: string, content: string): ParsedTabularRows {
  const ext = fileName.toLowerCase().split(".").pop();
  if (!ext || !["csv", "txt", "tsv"].includes(ext)) {
    throw new Error("Unsupported import file extension. Use CSV/TXT or paste from Excel.");
  }
  return parseTabularText(content);
}

const importKeyAliasMap: Record<string, string> = {
  assetname: "assetName",
  slug: "slug",
  internalcode: "internalCode",
  country: "country",
  state: "state",
  city: "city",
  address: "address",
  geolat: "geoLat",
  geolng: "geoLng",
  geolong: "geoLng",
  geolongitude: "geoLng",
  shortdescription: "shortDescription",
  longdescription: "longDescription",
  investmentthesis: "investmentThesis",
  risknotes: "riskNotes",
  videourl: "videoUrl",
  collectionname: "collectionName",
  collectionsymbol: "collectionSymbol",
  metadatabasename: "metadataBaseName",
  metadatabaseuri: "metadataBaseUri",
  buildingfundinggoal: "buildingFundingGoal",
  buildingtotalunits: "buildingTotalUnits",
  buildingnftcost: "buildingNftCost",
  buildingexpectedannualreturn: "buildingExpectedAnnualReturn",
  buildingexitstrategy: "buildingExitStrategy",
  buildingestimateddeliverydate: "buildingEstimatedDeliveryDate",
  buildingconstructionstartdate: "buildingConstructionStartDate"
};

export function mapImportRowToFormFields(row: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(row)) {
    const normalizedKey = normalizeHeaderKey(rawKey);
    const canonicalKey = importKeyAliasMap[normalizedKey] ?? rawKey;
    const value = rawValue.trim();
    if (value.length === 0) {
      continue;
    }
    mapped[canonicalKey] = value;
  }

  return mapped;
}
