type ParsedTabularRows = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export class AssetPdfBriefError extends Error {
  code: string;

  constructor(message: string, code = "INVALID_PDF_BRIEF") {
    super(message);
    this.name = "AssetPdfBriefError";
    this.code = code;
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMoney(rawValue: string): string {
  return rawValue.replace(/[$,\s]/g, "").trim();
}

function firstNonEmpty(...values: Array<string | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function matchMoneyValue(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return normalizeMoney(match[1]);
    }
  }

  return "";
}

function matchPercentValue(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function matchTextValue(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return collapseWhitespace(match[1]);
    }
  }

  return "";
}

function deriveLocation(address: string): { city: string; state: string; country: string } {
  const normalized = collapseWhitespace(address);
  const match = /,\s*([^,]+),\s*([A-Z]{2})\s*\d{4,5}(?:-\d{4})?$/i.exec(normalized);

  if (!match) {
    return { city: "", state: "", country: "US" };
  }

  return {
    city: collapseWhitespace(match[1]),
    state: match[2].toUpperCase(),
    country: "US"
  };
}

function deriveDurationMonths(durationLabel: string): string {
  const values = Array.from(durationLabel.matchAll(/\d+(?:\.\d+)?/g), (match) => Number(match[0]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return "";
  }

  return String(Math.max(...values));
}

function deriveProjectStage(text: string): string {
  if (/new\s+construction/i.test(text)) {
    return "new construction";
  }

  if (/fix\s*&\s*flip|fix\s+flip/i.test(text)) {
    return "fix & flip";
  }

  return "investment project";
}

function deriveExitStrategy(text: string): string {
  if (/listing\s*&\s*sale|listing\s+&\s+sale|sale/i.test(text)) {
    return "sale";
  }

  return "sale";
}

function deriveOperatorName(text: string): string {
  return firstNonEmpty(
    matchTextValue(text, [
      /Administraci[oó]n profesional por\s+(.+?)(?:11-\s*Technical Note|$)/is,
      /Estructurardor\s*-\s*Operador\s*:\s*(.+?)(?:11-\s*Technical Note|$)/is,
      /([A-Z][A-Za-z&+.\s]+?)\s+Managing Partners/i,
      /([A-Z][A-Za-z&+.\s]+?)\s+Project Managers\s*&\s*Operators/i
    ])
      .replace(/\s+Managing Partners.*$/i, "")
      .replace(/\s+Project Managers\s*&\s*Operators.*$/i, "")
  );
}

function deriveAssetName(input: {
  projectStage: string;
  city: string;
  internalCode: string;
  address: string;
}): string {
  const stage = input.projectStage === "new construction"
    ? "New Construction"
    : input.projectStage === "fix & flip"
      ? "Fix & Flip"
      : "Investment";
  const city = input.city || collapseWhitespace(input.address.split(",")[0] ?? "");
  const suffix = input.internalCode || city;

  return [stage, city, suffix]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDescriptions(input: {
  assetName: string;
  city: string;
  projectStage: string;
  address: string;
  purchasePriceUsd: string;
  afterRepairValueUsd: string;
  rehabBudgetUsd: string;
  buildingFundingGoal: string;
  projectedNetRoiPct: string;
  buildingDeveloperName: string;
  buildingProjectDurationMonths: string;
}): Pick<Record<string, string>, "shortDescription" | "longDescription" | "investmentThesis"> {
  const stageLabel = input.projectStage === "new construction" ? "new construction" : "fix & flip";
  const shortDescription = collapseWhitespace(
    `${input.assetName} is a ${stageLabel} opportunity in ${input.city || "Florida"} with a sale-driven exit and structured investor capital participation.`
  );
  const durationLabel = input.buildingProjectDurationMonths
    ? `${input.buildingProjectDurationMonths}-month`
    : "project";
  const longDescription = collapseWhitespace(
    `${input.assetName} covers the property at ${input.address}, combining acquisition, execution, and resale under a ${durationLabel} plan. ` +
    `${input.buildingDeveloperName ? `${input.buildingDeveloperName} operates the deal` : "The operator manages the deal"} with private lender support and collective investor capital.`
  );
  const investmentThesis = collapseWhitespace(
    `The investment thesis relies on acquiring around USD ${input.purchasePriceUsd || "0"}, improving the asset with roughly USD ${input.rehabBudgetUsd || "0"} in execution budget, ` +
    `and exiting against an ARV near USD ${input.afterRepairValueUsd || "0"}. ` +
    `${input.buildingFundingGoal ? `Minimum capital required is USD ${input.buildingFundingGoal}. ` : ""}` +
    `${input.projectedNetRoiPct ? `Projected net ROI is ${input.projectedNetRoiPct}%.` : ""}`
  );

  return {
    shortDescription,
    longDescription,
    investmentThesis
  };
}

function buildRiskNotes(text: string): string {
  const section = matchTextValue(text, [
    /9-\s*Security\s*&\s*Transparency\s+(.+?)(?:10-\s*Investment Highlights|$)/is
  ]);

  return collapseWhitespace(section);
}

export function parseInvestmentBriefTextToRows(text: string): ParsedTabularRows {
  const normalized = text.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  const collapsed = collapseWhitespace(normalized);

  const internalCode = matchTextValue(collapsed, [
    /Deal Number:\s*([A-Za-z0-9-]+)/i
  ]);
  const address = matchTextValue(collapsed, [
    /Address:\s*(.+?)\s+Purchase Price:/i
  ]);
  const purchasePriceUsd = matchMoneyValue(collapsed, [
    /Purchase Price:\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const afterRepairValueUsd = matchMoneyValue(collapsed, [
    /After Repair Value\s*\(ARV\):\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const rehabBudgetUsd = matchMoneyValue(collapsed, [
    /(?:Construction\s*\/\s*Rehab|Rehab Budget|Rehab\s*\/\s*Construction)\s+Budget:\s*\$?\s*([\d,]+(?:\.\d+)?)/i,
    /Rehab\s*\/\s*Construction\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const closingCostsUsd = matchMoneyValue(collapsed, [
    /Closing Costs(?:\s*\([^)]*\))?\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const holdingCostsUsd = matchMoneyValue(collapsed, [
    /Holding\s*&\s*Misc\.\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const sellingCostsUsd = matchMoneyValue(collapsed, [
    /Selling Costs(?:\s*\([^)]*\))?\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const totalProjectCostUsd = matchMoneyValue(collapsed, [
    /Total Project Cost\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const buildingFundingGoal = matchMoneyValue(collapsed, [
    /Minimum Capital Required to Participate in(?:\s+the)?\s+Project\s+\d+(?:\.\d+)?%\s+\$?\s*([\d,]+(?:\.\d+)?)/i,
    /Minimum Capital Required to Participate in(?:\s+the)?\s+Project\s+\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const buildingTotalUnits = matchTextValue(collapsed, [
    /Cantidad de Ticket de inversion\s*([0-9]+)/i,
    /MINIMUM TICKET\s+([0-9]+)/i
  ]);
  const buildingNftCost = matchMoneyValue(collapsed, [
    /MINIMUM TICKET\s+Ticket Value\s+Structuring fee\s+Total Participation Value\s+\d+\s+\$?\s*([\d,]+(?:\.\d+)?)/i,
    /Ticket Value\s+\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const structuringFeeUsd = matchMoneyValue(collapsed, [
    /Structuring fee\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const grossProfitProjectedUsd = matchMoneyValue(collapsed, [
    /Net Profit\s*\(before distribution\)\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const managementFeeUsd = matchMoneyValue(collapsed, [
    /Management Fee(?:\s*\([^)]*\))?\s+\d+(?:\.\d+)?%\s+\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const brokerFeeUsd = matchMoneyValue(collapsed, [
    /Broker Fee(?:\s*\([^)]*\))?\s+\d+(?:\.\d+)?%\s+\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const netInvestorProfitUsd = matchMoneyValue(collapsed, [
    /Net Profit for Investor\s*\$?\s*([\d,]+(?:\.\d+)?)/i
  ]);
  const projectedNetRoiPct = matchPercentValue(collapsed, [
    /Net Profit for Investor\s+\$?\s*[\d,]+(?:\.\d+)?\s+(\d+(?:\.\d+)?)%/i,
    /Total Investors(?:\s+\d+%)?\s+\$?\s*[\d,]+(?:\.\d+)?\s+(\d+(?:\.\d+)?)%/i
  ]);
  const durationLabel = firstNonEmpty(
    matchTextValue(collapsed, [/Total Estimated Duration\s+(.+?)(?:9-\s*Security|10-\s*Investment Highlights|$)/is]),
    matchTextValue(collapsed, [/Timing\s+(.+?)\s+2\s*-\s*Financial Breakdown/is])
  );
  const buildingProjectStage = deriveProjectStage(collapsed);
  const buildingDeveloperName = deriveOperatorName(collapsed);
  const buildingExitStrategy = deriveExitStrategy(collapsed);
  const riskNotes = buildRiskNotes(collapsed);
  const { city, state, country } = deriveLocation(address);
  const buildingProjectDurationMonths = deriveDurationMonths(durationLabel);

  const recognitionScore = [
    internalCode,
    address,
    purchasePriceUsd,
    afterRepairValueUsd,
    totalProjectCostUsd,
    buildingFundingGoal,
    projectedNetRoiPct
  ].filter(Boolean).length;

  if (recognitionScore < 4) {
    throw new AssetPdfBriefError(
      "This PDF does not match the supported investment brief template closely enough to auto-fill the form.",
      "UNSUPPORTED_PDF_TEMPLATE"
    );
  }

  const assetName = deriveAssetName({
    projectStage: buildingProjectStage,
    city,
    internalCode,
    address
  });
  const slug = toSlug(assetName || `${buildingProjectStage}-${city}-${internalCode}`);
  const descriptions = buildDescriptions({
    assetName,
    city,
    projectStage: buildingProjectStage,
    address,
    purchasePriceUsd,
    afterRepairValueUsd,
    rehabBudgetUsd,
    buildingFundingGoal,
    projectedNetRoiPct,
    buildingDeveloperName,
    buildingProjectDurationMonths
  });

  const row: Record<string, string> = {
    assetType: "building_new",
    assetName,
    slug,
    internalCode,
    country,
    state,
    city,
    address,
    ...descriptions,
    riskNotes,
    purchasePriceUsd,
    afterRepairValueUsd,
    rehabBudgetUsd,
    closingCostsUsd,
    holdingCostsUsd,
    sellingCostsUsd,
    totalProjectCostUsd,
    structuringFeeUsd,
    grossProfitProjectedUsd,
    managementFeeUsd,
    brokerFeeUsd,
    netInvestorProfitUsd,
    projectedNetRoiPct,
    buildingProjectStage,
    buildingDeveloperName,
    buildingTotalUnits,
    buildingFundingGoal,
    buildingNftCost,
    buildingExpectedAnnualReturn: projectedNetRoiPct,
    buildingExitStrategy,
    buildingProjectDurationMonths
  };

  const filteredRow = Object.fromEntries(
    Object.entries(row).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
  );

  return {
    headers: Object.keys(filteredRow),
    rows: [filteredRow]
  };
}
