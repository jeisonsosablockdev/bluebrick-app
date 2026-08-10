import { DomainAdapter, AdaptedModule } from "./index";

const COMPLIANCE_HINTS = `
Compliance/KYC/AML-specific adaptation patterns:
- "List facts, constraints, unknowns" → "List KYC status, AML flags, financial guardrails, audit requirements, wallet risk score, jurisdiction, sanctions list matches"
- "Make a table, list, or diagram" → "Create compliance queue table: wallet, KYC status, AML status, reviewer, decision, timestamp, notes; or decision flow diagram"
- "Consider counterexamples" → "What if KYC expired? What if AML flagged post-approval? What if jurisdiction changes? What if sanctioned entity?"
- "Check consistency" → "Verify: KYC→AML→financial guardrail chain consistent; suspended wallets blocked; audit trail complete; decisions documented"
- "Devise algorithm/procedure" → "Algorithm: queue case → review KYC → review AML → assess risk → decide (verify/reject/flag) → audit log → notify"
- "Step-by-step reasoning" → "Fetch profile → Check KYC status → Check AML status → Evaluate financial guardrails → Decide → Log audit → Update status"
- "Break into sub-problems" → "Split: profile fetch, KYC evaluation, AML screening, risk scoring, decision logic, audit logging, notification"
- "Identify goal" → "Final answer must include: compliance status, decision rationale, audit trail, guardrail enforcement, escalation path"
`;

export const COMPLIANCE_ADAPTER: DomainAdapter = {
  name: "compliance",
  getAdaptationHints: () => COMPLIANCE_HINTS,
  enhanceAdaptation: (modules: AdaptedModule[]): AdaptedModule[] => {
    const complianceKeywords = [
      "kyc", "aml", "guardrail", "audit", "compliance", "sanction",
      "kyc status", "aml flag", "risk score", "jurisdiction", "suspended"
    ];
    
    return modules.map(m => {
      const hasComplianceTerms = complianceKeywords.some(k => m.adapted.toLowerCase().includes(k.toLowerCase()));
      if (!hasComplianceTerms && m.original.toLowerCase().includes("fact")) {
        return { ...m, adapted: m.adapted + " (KYC status, AML flags, guardrails, audit reqs, risk score, jurisdiction)" };
      }
      if (!hasComplianceTerms && m.original.toLowerCase().includes("table")) {
        return { ...m, adapted: m.adapted + " (queue: wallet, KYC, AML, reviewer, decision, timestamp, notes)" };
      }
      if (!hasComplianceTerms && m.original.toLowerCase().includes("counterexample")) {
        return { ...m, adapted: m.adapted + " (expired KYC, post-approval AML, jurisdiction change, sanctioned entity)" };
      }
      if (!hasComplianceTerms && m.original.toLowerCase().includes("consistency")) {
        return { ...m, adapted: m.adapted + " (KYC→AML→guardrail chain, suspended blocked, audit complete)" };
      }
      return m;
    });
  },
};