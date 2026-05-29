import { describe, expect, it } from "vitest";

import { AssetPdfBriefError, parseInvestmentBriefTextToRows } from "@/lib/admin/asset-pdf-brief";

const brandonBriefText = `
BLUE BRICK INVESTMENTS OPPORTUNITY BRIEF BRANDON - FLORIDA
Deal Number: 117
1- Property Overview
Address: 117 Hickory Creek Blvd, Brandon, FL 33511
Purchase Price: $275,000
After Repair Value (ARV): $580,000
Rehab Budget: $150,000
Project Type: Fix & Flip Residential
2 -Financial Breakdown
Closing Costs (7%) $18,550
Rehab / Construction $150,000
Holding & Misc. $5,413
Selling Costs (7%) $40,600
Total Project Cost $490,163
3- Capital Structure
Minimum Capital Required to Participate in the Project 30% $147,049
Cantidad de Ticket de inversion 10
Structuring fee $5,395
MINIMUM TICKET Ticket Value Structuring fee Total Participation Value
10 $14,705 $540 $15,244
4- Projected Profit Analysis
Net Profit (before distribution) $89,837
6- Application of Fees to Investor Profit
Management Fee (of invested capital) 2% $2,941
Broker Fee (of capital raised) 6% $8,823
Net Profit for Investor $33,155 21.75%
8- Estimated Timeline
Total Estimated Duration 9 12 Months
9- Security & Transparency
Escrow Account: fondos de inversionistas gestionados bajo una cuenta escrow específica por proyecto.
LLC Independiente: el proyecto opera bajo su propia estructura legal (SPV).
Private Lender Oversight: liberación de fondos según hitos verificados.
Contracts & Reports: contrato firmado, reportes mensuales de avance y cierre contable al final.
Exit Strategy: liquidación final y distribución de utilidades desde la cuenta escrow.
10- Investment Highlights
✅Estructurardor - Operador: Blue Brick Capital LLC + Quality asset group inc
`;

describe("lib/admin/asset-pdf-brief", () => {
  it("extracts a supported investment brief into canonical form fields", () => {
    const parsed = parseInvestmentBriefTextToRows(brandonBriefText);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.headers).toContain("assetType");

    expect(parsed.rows[0]).toMatchObject({
      assetType: "building_new",
      internalCode: "117",
      assetName: "Fix & Flip Brandon 117",
      slug: "fix-flip-brandon-117",
      country: "US",
      state: "FL",
      city: "Brandon",
      address: "117 Hickory Creek Blvd, Brandon, FL 33511",
      purchasePriceUsd: "275000",
      afterRepairValueUsd: "580000",
      rehabBudgetUsd: "150000",
      closingCostsUsd: "18550",
      holdingCostsUsd: "5413",
      sellingCostsUsd: "40600",
      totalProjectCostUsd: "490163",
      structuringFeeUsd: "5395",
      grossProfitProjectedUsd: "89837",
      managementFeeUsd: "2941",
      brokerFeeUsd: "8823",
      netInvestorProfitUsd: "33155",
      projectedNetRoiPct: "21.75",
      buildingProjectStage: "fix & flip",
      buildingDeveloperName: "Blue Brick Capital LLC + Quality asset group inc",
      buildingFundingGoal: "147049",
      buildingTotalUnits: "10",
      buildingNftCost: "14705",
      buildingExitStrategy: "sale",
      buildingProjectDurationMonths: "12"
    });

    expect(parsed.rows[0].riskNotes).toContain("Escrow Account:");
    expect(parsed.rows[0].shortDescription).toContain("Brandon");
    expect(parsed.rows[0].longDescription).toContain("Hickory Creek Blvd");
    expect(parsed.rows[0].investmentThesis).toContain("Projected net ROI is 21.75%");
  });

  it("rejects unsupported PDFs with a clear error", () => {
    expect(() => parseInvestmentBriefTextToRows("random brochure without deal economics")).toThrow(AssetPdfBriefError);
    expect(() => parseInvestmentBriefTextToRows("random brochure without deal economics")).toThrow(
      "This PDF does not match the supported investment brief template closely enough to auto-fill the form."
    );
  });
});
