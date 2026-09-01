/**
 * @file apps/web/src/lib/auth/investment-actions.ts
 * @description Layer 2: Application - Server actions for investment lead workflows.
 * Authenticates the requesting investor session via WorkOS, enforces rate limiting,
 * validates payload contracts, and triggers the domain notification pipeline.
 */

"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { getAuthenticatedInvestor } from "@/lib/auth/workos-session";
import {
  investmentLeadSchema,
  type InvestmentLeadPayload,
} from "@/lib/pipelines/investment-lead/investment-lead-schema";
import {
  buildInvestmentLeadHtml,
  buildInvestmentLeadPlainText,
} from "@/lib/pipelines/investment-lead/investment-lead-template";
import { sendSmtpEmail } from "@/lib/infrastructure/email/smtp-mailer";

/**
 * Cooldown duration in milliseconds (60 seconds) between submissions per investor.
 */
const COOLDOWN_DURATION_MS = 60_000;

/**
 * In-memory anti-flooding cache mapping investorId to last successful submission epoch timestamp.
 */
const investorCooldownStore = new Map<string, number>();

/**
 * Clears the cooldown cache. Primarily for testing and administrative resets.
 */
export function clearInvestmentLeadCooldowns(): void {
  investorCooldownStore.clear();
}

/**
 * Result contract returned by submitInvestmentLeadAction.
 */
export interface InvestmentLeadActionResult {
  readonly success: boolean;
  readonly message: string;
  readonly error?: string;
}

/**
 * Submits an investment lead notification on behalf of the currently authenticated investor.
 *
 * Security Invariants & Authority Guards:
 * - Session MUST be authenticated via WorkOS AuthKit; unauthenticated requests fail fast before SMTP.
 * - Rate limiting / anti-flooding guard enforces 60-second cooldown per investorId to prevent duplicate spam.
 * - Lead payload is strictly validated using Layer 3 investmentLeadSchema.
 * - Email is dispatched to `contacto@bluebrick.capital` with sanitized content.
 *
 * @param _payload Optional client metadata or partial lead overrides.
 * @returns Standardized action result.
 */
export async function submitInvestmentLeadAction(
  _payload?: Partial<InvestmentLeadPayload>
): Promise<InvestmentLeadActionResult> {
  // Step 1: Verify authenticated WorkOS investor session
  // Authority Guard: Invariant - unauthenticated callers must fail fast before downstream operations
  let investor;
  try {
    const auth = await withAuth();
    investor = await getAuthenticatedInvestor();

    if (!auth?.user || !investor?.id) {
      return {
        success: false,
        message: "No se encuentra autenticado.",
        error: "UNAUTHENTICATED: Active investor session is required",
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: "No se encuentra autenticado.",
      error: errorMsg.includes("UNAUTHENTICATED") ? errorMsg : `UNAUTHENTICATED: ${errorMsg}`,
    };
  }

  // Step 2: Enforce anti-flooding cooldown rate limiting per investor ID
  // Security Invariant: Duplicate submissions within the 60-second cooldown period must be blocked
  const lastSubmissionTime = investorCooldownStore.get(investor.id);
  const now = Date.now();
  if (lastSubmissionTime !== undefined && now - lastSubmissionTime < COOLDOWN_DURATION_MS) {
    return {
      success: false,
      message: "Por favor espere antes de enviar una nueva solicitud de inversión.",
      error: "RATE_LIMIT_COOLDOWN_ACTIVE: Submission cooldown period has not elapsed",
    };
  }

  // Step 3: Validate lead payload with investmentLeadSchema
  const investorFullName = [investor.firstName, investor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const rawPayload = {
    investorId: _payload?.investorId ?? investor.id,
    investorName: _payload?.investorName ?? (investorFullName || "Inversionista"),
    investorEmail: _payload?.investorEmail ?? investor.email,
    tier: _payload?.tier ?? investor.tier ?? "BRONZE",
    timestamp: _payload?.timestamp ?? new Date().toISOString(),
    metadata: _payload?.metadata,
  };

  const validationResult = investmentLeadSchema.safeParse(rawPayload);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Los datos de la solicitud son inválidos.",
      error: validationResult.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  const validatedLead = validationResult.data;

  // Step 4: Generate rich HTML and plain-text email templates
  const emailHtml = buildInvestmentLeadHtml(validatedLead);
  const emailText = buildInvestmentLeadPlainText(validatedLead);
  const emailSubject = `Nuevo Lead de Inversión - ${validatedLead.investorName}`;

  // Step 5: Dispatch email notification via SMTP transport
  const emailResult = await sendSmtpEmail({
    to: "contacto@bluebrick.capital",
    subject: emailSubject,
    html: emailHtml,
    text: emailText,
    replyTo: validatedLead.investorEmail,
  });

  if (!emailResult.success) {
    return {
      success: false,
      message: "No fue posible enviar la notificación en este momento.",
      error: emailResult.error ?? "SMTP_DISPATCH_FAILED",
    };
  }

  // Step 6: Update cooldown timestamp for this investor upon successful dispatch
  investorCooldownStore.set(investor.id, Date.now());

  // Step 7: Return structured success response contract
  return {
    success: true,
    message: "Solicitud de inversión enviada con éxito. Nuestro equipo se comunicará a la brevedad.",
  };
}
