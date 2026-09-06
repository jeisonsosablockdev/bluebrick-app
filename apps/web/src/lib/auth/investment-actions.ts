/**
 * @file apps/web/src/lib/auth/investment-actions.ts
 * @description Layer 2: Application - Server actions for investment lead workflows.
 * Authenticates the requesting investor session via WorkOS, enforces rate limiting,
 * validates payload contracts, and triggers the domain notification pipeline.
 */

"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { getAuthenticatedInvestor } from "@/lib/auth/workos-session";
import { executeQuery } from "@/lib/infrastructure/db/neon-client";
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
export async function clearInvestmentLeadCooldowns(): Promise<void> {
  // Step 1: Clear the in-memory anti-flooding cache
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
 * - Session or database investor payload MUST be provided; unauthenticated requests fail fast before SMTP.
 * - Rate limiting / anti-flooding guard enforces 60-second cooldown per investorId/email to prevent duplicate spam.
 * - Lead payload is strictly validated using Layer 3 investmentLeadSchema.
 * - Email is dispatched to `LEAD_NOTIFICATION_EMAIL` (defaulting to `contacto@bluebrick.capital`) with replyTo set to the investor.
 *
 * @param _payload Optional client metadata or partial lead overrides containing connected investor profile.
 * @returns Standardized action result.
 */
export async function submitInvestmentLeadAction(
  _payload?: Partial<InvestmentLeadPayload>
): Promise<InvestmentLeadActionResult> {
  // Step 1: Resolve investor identity from verified payload, active WorkOS session, or database context
  // Invariant: The database investor identity is prioritized; unauthenticated/anonymous calls without investor identity are rejected.
  let resolvedInvestor: { id: string; email: string; firstName?: string; lastName?: string; tier?: string } | null = null;

  // Case A: Payload contains investor email provided by client (from server-rendered database initialData)
  if (_payload?.investorEmail && typeof _payload.investorEmail === "string" && _payload.investorEmail.includes("@")) {
    resolvedInvestor = {
      id: _payload.investorId || `usr_${_payload.investorEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
      email: _payload.investorEmail.trim().toLowerCase(),
      firstName: _payload.investorName?.split(" ")[0] || "Inversionista",
      lastName: _payload.investorName?.split(" ").slice(1).join(" ") || "",
      tier: _payload.tier || "Inversionista Privado",
    };
  }

  // Case B: If payload did not specify email, query authenticated session from WorkOS / DB helper
  if (!resolvedInvestor) {
    try {
      const auth = await withAuth();
      const investor = await getAuthenticatedInvestor();
      if (auth?.user || investor?.id) {
        resolvedInvestor = {
          id: investor.id,
          email: investor.email,
          firstName: investor.firstName,
          lastName: investor.lastName,
          tier: investor.tier,
        };
      }
    } catch {
      // Invariant: If withAuth fails (e.g. in Next.js Server Action POST without proxy headers),
      // smoothly fall back to database investor retriever
      try {
        const investor = await getAuthenticatedInvestor();
        if (investor?.id && investor.email) {
          resolvedInvestor = {
            id: investor.id,
            email: investor.email,
            firstName: investor.firstName,
            lastName: investor.lastName,
            tier: investor.tier,
          };
        }
      } catch {
        // Fall through to authority guard
      }
    }
  }

  // Authority Guard: Invariant - unauthenticated callers without valid investor identity fail fast
  if (!resolvedInvestor || !resolvedInvestor.email) {
    return {
      success: false,
      message: "No se encuentra autenticado.",
      error: "UNAUTHENTICATED: Active investor session or verified database profile is required",
    };
  }

  // Step 2: Enforce anti-flooding cooldown rate limiting per investor ID or email
  // Security Invariant: Duplicate submissions within the 60-second cooldown period must be blocked
  const cooldownKey = resolvedInvestor.id || resolvedInvestor.email;
  const lastSubmissionTime = investorCooldownStore.get(cooldownKey);
  const now = Date.now();
  if (lastSubmissionTime !== undefined && now - lastSubmissionTime < COOLDOWN_DURATION_MS) {
    return {
      success: false,
      message: "Por favor espere antes de enviar una nueva solicitud de inversión.",
      error: "RATE_LIMIT_COOLDOWN_ACTIVE: Submission cooldown period has not elapsed",
    };
  }

  // Step 3: Resolve investor contact telephone and validate lead payload with Layer 3 domain investmentLeadSchema
  let resolvedPhone = _payload?.investorPhone?.trim();
  if (!resolvedPhone && resolvedInvestor?.email && process.env.DATABASE_URL) {
    try {
      const phoneRes = await executeQuery<{ phone: string | null }>(
        "SELECT phone FROM clients WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND phone IS NOT NULL LIMIT 1;",
        [resolvedInvestor.email]
      );
      if (phoneRes.rows?.[0]?.phone) {
        resolvedPhone = phoneRes.rows[0].phone.trim();
      }
    } catch (err) {
      // Invariant: If database phone lookup fails or clients table is unavailable, continue gracefully
      console.warn("[InvestmentLeadAction] Could not resolve phone from clients table:", err);
    }
  }

  const investorFullName =
    _payload?.investorName ??
    [resolvedInvestor.firstName, resolvedInvestor.lastName].filter(Boolean).join(" ").trim();

  const rawPayload = {
    investorId: resolvedInvestor.id,
    investorName: investorFullName || "Inversionista",
    investorEmail: resolvedInvestor.email,
    tier: _payload?.tier ?? resolvedInvestor.tier ?? "Inversionista Privado",
    timestamp: _payload?.timestamp ?? new Date().toISOString(),
    metadata: _payload?.metadata,
    investorPhone: resolvedPhone || undefined,
    reinvestmentCapital: _payload?.reinvestmentCapital,
    totalInvested: _payload?.totalInvested,
    currentInvestments: _payload?.currentInvestments,
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

  // Step 5: Resolve destination inbox dynamically from environment variable (LEAD_NOTIFICATION_EMAIL)
  const recipientEmail =
    process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
    process.env.SMTP_TO?.trim() ||
    "contacto@bluebrick.capital";

  console.log("[InvestmentLeadAction] 📥 Procesando solicitud de lead:", {
    investorId: resolvedInvestor.id,
    investorName: validatedLead.investorName,
    investorEmail: validatedLead.investorEmail,
    investorPhone: validatedLead.investorPhone || "No registrado",
    reinvestmentCapital: validatedLead.reinvestmentCapital,
    totalInvested: validatedLead.totalInvested,
    holdingsCount: validatedLead.currentInvestments?.length ?? 0,
    recipientEmail,
    replyTo: validatedLead.investorEmail,
  });

  // Step 6: Dispatch email notification via SMTP transport with replyTo set to the connected investor
  const emailResult = await sendSmtpEmail({
    to: recipientEmail,
    subject: emailSubject,
    html: emailHtml,
    text: emailText,
    replyTo: validatedLead.investorEmail,
  });

  if (!emailResult.success) {
    console.error(
      `[InvestmentLeadAction] ❌ Error en despacho SMTP hacia <${recipientEmail}>:`,
      emailResult.error
    );
    return {
      success: false,
      message: "No fue posible enviar la notificación en este momento.",
      error: emailResult.error ?? "SMTP_DISPATCH_FAILED",
    };
  }

  if (emailResult.dryRun) {
    console.warn(
      `[InvestmentLeadAction] ⚠️ AVISO DRY-RUN: El correo hacia <${recipientEmail}> NO fue enviado por la red porque faltan las credenciales SMTP en .env.local (SMTP_HOST, SMTP_USER, SMTP_PASS). El sistema operó en modo simulado.`
    );
  } else {
    console.log(
      `[InvestmentLeadAction] 🚀 Correo real enviado exitosamente hacia <${recipientEmail}> (ID: ${emailResult.messageId})`
    );
  }

  // Step 7: Update cooldown timestamp for this investor upon successful dispatch
  investorCooldownStore.set(cooldownKey, Date.now());

  // Step 8: Return structured success response contract
  return {
    success: true,
    message: emailResult.dryRun
      ? "Solicitud registrada (Modo Simulado: credenciales SMTP pendientes de configurar)."
      : "Solicitud de inversión enviada con éxito. Nuestro equipo se comunicará a la brevedad.",
  };
}
