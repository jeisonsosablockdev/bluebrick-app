/**
 * @file apps/web/src/lib/infrastructure/email/smtp-mailer.ts
 * @description Layer 4: Infrastructure - Resilient Nodemailer SMTP email transport adapter.
 * Provides configuration parsing, secure connection setup, and automated dry-run fallback
 * when SMTP credentials are not configured in test or development environments.
 */

import nodemailer from "nodemailer";

/**
 * SMTP transport configuration contract.
 */
export interface SmtpConfig {
  /** Host address of the SMTP server */
  readonly host: string;
  /** Port of the SMTP service (typically 465 for SSL or 587 for TLS) */
  readonly port: number;
  /** Whether to enforce strict TLS/SSL connection */
  readonly secure: boolean;
  /** Optional authentication credentials */
  readonly auth?: {
    readonly user: string;
    readonly pass: string;
  };
  /** Default sender email address */
  readonly defaultFrom: string;
}

/**
 * Outbound email delivery parameter contract.
 */
export interface SendEmailParams {
  /** Recipient email address or comma-separated addresses */
  readonly to: string;
  /** Optional sender address; falls back to configured defaultFrom */
  readonly from?: string;
  /** Email subject line */
  readonly subject: string;
  /** Plain text email body */
  readonly text?: string;
  /** Rich HTML email body */
  readonly html?: string;
  /** Optional reply-to address */
  readonly replyTo?: string;
}

/**
 * Result contract returned by email dispatch operations.
 */
export interface SendEmailResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly dryRun: boolean;
  readonly error?: string;
}

/**
 * Resolves SMTP configuration from explicit parameters or environment variables.
 *
 * Security Invariants:
 * - If credentials or host are missing, safely returns null to trigger dry-run fallback.
 * - When explicit config provides `auth: undefined`, environment credentials are bypassed.
 *
 * @param config Optional partial configuration to override environment defaults.
 * @returns Complete SmtpConfig if valid, or null for dry-run fallback mode.
 */
export function resolveSmtpConfig(config?: Partial<SmtpConfig>): SmtpConfig | null {
  // Step 1: Resolve host from parameter or environment
  const host = config?.host ?? process.env.SMTP_HOST;

  // Step 2: Resolve port with default 587
  const port = config?.port ?? (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);

  // Step 3: Resolve SSL/TLS secure mode (implicit for port 465)
  const secure = config?.secure !== undefined
    ? config.secure
    : (process.env.SMTP_SECURE === "true" || port === 465);

  // Step 4: Resolve authentication credentials
  const hasExplicitAuth = config !== undefined && "auth" in config;
  const user = hasExplicitAuth ? config?.auth?.user : (config?.auth?.user ?? process.env.SMTP_USER);
  const pass = hasExplicitAuth ? config?.auth?.pass : (config?.auth?.pass ?? process.env.SMTP_PASS);

  // Step 5: Resolve default from address
  const defaultFrom = config?.defaultFrom ?? process.env.SMTP_FROM ?? "BlueBrick Capital <leads@bluebrick.capital>";

  // Security Invariant: Host, user, and password must all be present for live network dispatch
  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    defaultFrom,
  };
}

/**
 * Dispatches an email via SMTP transport or simulates delivery in dry-run mode.
 *
 * Security Invariants & Authority Guards:
 * - Passwords and credentials must never be leaked in error responses or logs.
 * - Missing credentials gracefully default to dry-run mode without raising exceptions.
 * - Handles network timeouts and socket failures gracefully.
 *
 * @param params Email delivery options including recipient, subject, and content.
 * @param config Optional explicit SMTP configuration overriding environment variables.
 * @returns Delivery result indicating success or failure status and messageId.
 */
export async function sendSmtpEmail(
  params: SendEmailParams,
  config?: Partial<SmtpConfig>
): Promise<SendEmailResult> {
  // Step 1: Resolve SMTP configuration from environment or explicit overrides
  const resolvedConfig = resolveSmtpConfig(config);

  // Step 2: Determine if transport should operate in dry-run mode
  if (!resolvedConfig || !resolvedConfig.auth) {
    const dryRunId = `dry-run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      messageId: dryRunId,
      dryRun: true,
    };
  }

  // Step 3: Instantiate nodemailer transport and dispatch email
  try {
    const transporter = nodemailer.createTransport({
      host: resolvedConfig.host,
      port: resolvedConfig.port,
      secure: resolvedConfig.secure,
      auth: {
        user: resolvedConfig.auth.user,
        pass: resolvedConfig.auth.pass,
      },
    });

    // Step 4: Dispatch email via transporter
    const info = await transporter.sendMail({
      from: params.from ?? resolvedConfig.defaultFrom,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      replyTo: params.replyTo,
    });

    return {
      success: true,
      messageId: info?.messageId ?? `sent-${Date.now()}`,
      dryRun: false,
    };
  } catch (error) {
    // Step 5: Catch transport errors and sanitize credentials
    const rawErrorMessage = error instanceof Error ? error.message : String(error);
    const passToRedact = resolvedConfig.auth?.pass;

    // Security Invariant: Ensure password is never exposed in error message
    const sanitizedError = passToRedact
      ? rawErrorMessage.replaceAll(passToRedact, "[REDACTED]")
      : rawErrorMessage;

    return {
      success: false,
      dryRun: false,
      error: sanitizedError,
    };
  }
}
