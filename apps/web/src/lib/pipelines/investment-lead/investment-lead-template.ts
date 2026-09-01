/**
 * @file apps/web/src/lib/pipelines/investment-lead/investment-lead-template.ts
 * @description Layer 3: Domain - Corporate email template generation for investment leads.
 * Generates luxury dark-mode HTML and accessible plain-text versions of notification emails
 * sent to the BlueBrick operations team upon investor CTA submission.
 */

import type { InvestmentLeadPayload } from "./investment-lead-schema";

/**
 * Escapes special HTML characters to prevent XSS injection attacks.
 *
 * Security Invariant:
 * - Neutralizes raw characters that could be interpreted as executable HTML/JavaScript tags or attributes.
 *
 * @param value The raw string to sanitize.
 * @returns Sanitized string with HTML character entities.
 */
export function escapeHtml(value: string): string {
  // Step 1: Guard against falsy or empty values
  if (!value) {
    return "";
  }

  // Step 2: Replace special characters with their HTML entity counterparts
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates the rich HTML corporate notification email for an investment lead.
 *
 * Security Invariants & Authority Guards:
 * - Sanitizes all dynamic investor inputs using escapeHtml to prevent HTML/XSS injection.
 * - Produces self-contained, inline-styled email-client compatible HTML.
 * - Embeds institutional BlueBrick corporate branding and direct mailto quick-reply CTA.
 *
 * @param payload Verified investment lead data.
 * @returns Complete HTML email document as a string.
 */
export function buildInvestmentLeadHtml(payload: InvestmentLeadPayload): string {
  // Step 1: Sanitize all dynamic string inputs to neutralize XSS vectors
  const sanitizedName = escapeHtml(payload.investorName);
  const sanitizedEmail = escapeHtml(payload.investorEmail);
  const sanitizedTier = escapeHtml(payload.tier);
  const sanitizedId = escapeHtml(payload.investorId);
  const sanitizedTimestamp = escapeHtml(payload.timestamp ?? new Date().toISOString());

  // Step 2: Format optional metadata table rows if present
  const metadataRows = payload.metadata && Object.keys(payload.metadata).length > 0
    ? Object.entries(payload.metadata)
        .map(([key, value]) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #1F2937; color: #9CA3AF; font-size: 13px;">${escapeHtml(key)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #1F2937; color: #F3F4F6; font-size: 13px; font-family: monospace;">${escapeHtml(String(value))}</td>
          </tr>
        `)
        .join("")
    : "";

  const metadataSection = metadataRows
    ? `
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF;">Metadatos de la Solicitud</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #111827; border-radius: 8px; overflow: hidden; border: 1px solid #1F2937;">
          ${metadataRows}
        </table>
      </div>
    `
    : "";

  // Step 3: Assemble corporate dark-mode email document with BlueBrick branding
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Lead de Inversión - BlueBrick</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F3F4F6; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header with BlueBrick branding -->
    <div style="padding: 24px 32px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-bottom: 1px solid #334155;">
      <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.1em; color: #38BDF8; text-transform: uppercase;">BLUEBRICK</span>
      <span style="font-size: 14px; font-weight: 500; color: #94A3B8; margin-left: 8px;">Institutional Capital</span>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #FFFFFF;">Nuevo Lead de Inversión</h1>
      <p style="margin: 0 0 24px; color: #94A3B8; font-size: 14px;">
        Un inversionista ha solicitado más información a través de la plataforma institucional.
      </p>

      <!-- Investor Details Card -->
      <table style="width: 100%; border-collapse: collapse; background-color: #1E293B; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94A3B8; font-size: 14px; width: 140px;">Nombre</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #FFFFFF; font-size: 14px; font-weight: 600;">${sanitizedName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94A3B8; font-size: 14px;">Email</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #38BDF8; font-size: 14px;">
            <a href="mailto:${sanitizedEmail}" style="color: #38BDF8; text-decoration: none;">${sanitizedEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94A3B8; font-size: 14px;">Nivel / Tier</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #F59E0B; font-size: 14px; font-weight: 600;">${sanitizedTier}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94A3B8; font-size: 14px;">ID Inversionista</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155; color: #94A3B8; font-size: 13px; font-family: monospace;">${sanitizedId}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #94A3B8; font-size: 14px;">Fecha / Hora</td>
          <td style="padding: 12px 16px; color: #94A3B8; font-size: 13px;">${sanitizedTimestamp}</td>
        </tr>
      </table>

      ${metadataSection}

      <!-- Interactive Quick-Reply CTA -->
      <div style="margin-top: 32px; text-align: center;">
        <a href="mailto:${sanitizedEmail}?subject=Re:%20Oportunidad%20de%20Inversi%C3%B3n%20BlueBrick" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
          Responder a ${sanitizedName}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #0A0F1D; border-top: 1px solid #1E293B; text-align: center; font-size: 12px; color: #64748B;">
      Este es un correo institucional generado automáticamente por el sistema de notificaciones de BlueBrick Capital.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates plain-text fallback version of the investment lead notification email.
 *
 * Invariants:
 * - Content must contain identical key investor facts as the HTML version.
 * - Strictly no HTML tags permitted.
 *
 * @param payload Verified investment lead data.
 * @returns Plain text formatted email string.
 */
export function buildInvestmentLeadPlainText(payload: InvestmentLeadPayload): string {
  // Step 1: Resolve timestamp
  const timestamp = payload.timestamp ?? new Date().toISOString();

  // Step 2: Format metadata lines cleanly without HTML
  const metadataLines = payload.metadata && Object.keys(payload.metadata).length > 0
    ? Object.entries(payload.metadata)
        .map(([k, v]) => `  - ${k}: ${String(v)}`)
        .join("\n")
    : "  (Ninguno)";

  // Step 3: Assemble un-formatted text summary with institutional facts
  return [
    "==================================================",
    "BLUEBRICK CAPITAL - NOTIFICACIÓN DE LEAD DE INVERSIÓN",
    "==================================================",
    "",
    "Detalles del Inversionista:",
    `  - Nombre: ${payload.investorName}`,
    `  - Email: ${payload.investorEmail}`,
    `  - Nivel / Tier: ${payload.tier}`,
    `  - ID: ${payload.investorId}`,
    `  - Timestamp: ${timestamp}`,
    "",
    "Metadatos Adicionales:",
    metadataLines,
    "",
    "Acción Requerida:",
    `  Responder directamente al inversionista: ${payload.investorEmail}`,
    "",
    "BlueBrick Institutional Capital - Notificación Automática",
    "==================================================",
  ].join("\n");
}
