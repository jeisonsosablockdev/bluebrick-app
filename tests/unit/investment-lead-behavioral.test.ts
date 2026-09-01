/**
 * @file tests/unit/investment-lead-behavioral.test.ts
 * @description Layer 2, Layer 3 & Layer 4: Behavioral Unit and Integration Test Suite for BBC-17.
 * Validates domain contracts, invariants, and pipeline orchestration for the Investment Lead Notification System:
 *   - Layer 3 Domain Schema: investmentLeadSchema validation, constraints, default values, and error messaging.
 *   - Layer 3 Domain Email Templates: buildInvestmentLeadHtml and buildInvestmentLeadPlainText content formatting,
 *     corporate branding, operational metadata inclusion, and HTML/XSS sanitization invariants.
 *   - Layer 4 Infrastructure SMTP Client: sendSmtpEmail behavior in dryRun fallback mode (missing credentials)
 *     and live authenticated Nodemailer transporter dispatch with resilient exception handling.
 *   - Layer 2 Application Server Action: submitInvestmentLeadAction authority verification (WorkOS session auth),
 *     anti-flooding rate limiting / cooldown protection, and domain notification pipeline execution.
 * @spec BBC-17
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  investmentLeadSchema,
  type InvestmentLeadPayload,
} from "@/lib/pipelines/investment-lead/investment-lead-schema";
import {
  buildInvestmentLeadHtml,
  buildInvestmentLeadPlainText,
} from "@/lib/pipelines/investment-lead/investment-lead-template";
import {
  sendSmtpEmail,
  type SendEmailParams,
  type SmtpConfig,
} from "@/lib/infrastructure/email/smtp-mailer";
import { submitInvestmentLeadAction } from "@/lib/auth/investment-actions";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getAuthenticatedInvestor } from "@/lib/auth/workos-session";

/**
 * Mock function tracking invocations of nodemailer transporter.sendMail.
 */
const mockSendMail = vi.fn();

/**
 * Mock function tracking invocations of nodemailer.createTransport.
 */
const mockCreateTransport = vi.fn().mockReturnValue({
  sendMail: mockSendMail,
});

// Mock nodemailer transport module to isolate network dispatch
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => mockCreateTransport(...args),
  },
  createTransport: (...args: unknown[]) => mockCreateTransport(...args),
}));

// Mock Next.js headers to avoid runtime errors in server action contexts
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
  }),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock WorkOS AuthKit Next.js session helper
vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: vi.fn(),
  getSignInUrl: vi.fn(),
  getSignUpUrl: vi.fn(),
  signOut: vi.fn(),
}));

// Mock BlueBrick WorkOS authenticated investor provider
vi.mock("@/lib/auth/workos-session", () => ({
  getAuthenticatedInvestor: vi.fn(),
}));

// Spy and mock wrapper on SMTP mailer infrastructure
vi.mock("@/lib/infrastructure/email/smtp-mailer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/infrastructure/email/smtp-mailer")>();
  return {
    ...actual,
    sendSmtpEmail: vi.fn(actual.sendSmtpEmail),
  };
});

/**
 * Fixture: Canonical valid investment lead payload for test scenarios.
 */
const VALID_LEAD_PAYLOAD: Readonly<InvestmentLeadPayload> = {
  investorId: "usr_01HXYZ123456789",
  investorName: "Sofía Martínez",
  investorEmail: "sofia.martinez@bluebrick.investments",
  tier: "Inversionista Privado",
  timestamp: "2026-09-01T12:00:00.000Z",
  metadata: {
    source: "reinvestment_opportunities_cta",
    portfolioValuation: "$250,000",
  },
};

/**
 * Fixture: Canonical outbound email parameters.
 */
const VALID_EMAIL_PARAMS: Readonly<SendEmailParams> = {
  to: "contacto@bluebrick.capital",
  from: "BlueBrick Notifications <leads@bluebrick.capital>",
  subject: "Nuevo Lead de Inversión - Sofía Martínez",
  text: "Detalles del lead de inversión",
  html: "<p>Detalles del lead de inversión</p>",
  replyTo: "sofia.martinez@bluebrick.investments",
};

/**
 * Fixture: Fully configured SMTP credentials for live transport testing.
 */
const CONFIGURED_SMTP_CONFIG: Readonly<SmtpConfig> = {
  host: "mail.bluebrick.capital",
  port: 465,
  secure: true,
  auth: {
    user: "leads@bluebrick.capital",
    pass: "corporate-secure-smtp-password-987",
  },
  defaultFrom: "BlueBrick Capital <leads@bluebrick.capital>",
};

describe("BBC-17: Investment Lead Behavioral Suite (@spec BBC-17)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Layer 3: Domain Schema Contract & Invariants
  // =========================================================================
  describe("Layer 3: Domain Schema - investmentLeadSchema Validation & Invariants", () => {
    it("should parse and validate a complete valid investment lead payload", () => {
      // Arrange
      // Step 1: Prepare canonical valid payload matching domain requirements
      const input = { ...VALID_LEAD_PAYLOAD };

      // Act
      // Step 2: Execute schema safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify successful validation and data retention
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.investorId).toBe("usr_01HXYZ123456789");
        expect(result.data.investorName).toBe("Sofía Martínez");
        expect(result.data.investorEmail).toBe("sofia.martinez@bluebrick.investments");
        expect(result.data.tier).toBe("Inversionista Privado");
        expect(result.data.timestamp).toBe("2026-09-01T12:00:00.000Z");
        expect(result.data.metadata?.source).toBe("reinvestment_opportunities_cta");
      }
    });

    it("should assign default tier 'BRONZE' when tier is omitted from input payload", () => {
      // Arrange
      // Step 1: Omit tier property from input payload
      const input = {
        investorId: "usr_01HXYZ123456789",
        investorName: "Sofía Martínez",
        investorEmail: "sofia.martinez@bluebrick.investments",
      };

      // Act
      // Step 2: Parse payload with omitted tier
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify default tier assignment
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe("BRONZE");
      }
    });

    it("should reject payload with missing or empty investorId with exact descriptive error", () => {
      // Arrange
      // Step 1: Construct invalid payload with empty string investorId
      // Edge Case: Empty investorId must fail fast before downstream persistence or email dispatch
      const input = {
        investorId: "",
        investorName: "Sofía Martínez",
        investorEmail: "sofia.martinez@bluebrick.investments",
      };

      // Act
      // Step 2: Execute safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify rejection and specific error message
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorIssue = result.error.issues.find((issue) => issue.path.includes("investorId"));
        expect(errorIssue).toBeDefined();
        expect(errorIssue?.message).toBe("Investor ID is required");
      }
    });

    it("should reject investorName shorter than 2 characters with exact descriptive error", () => {
      // Arrange
      // Step 1: Construct invalid payload with single-character investorName
      // Edge Case: 1-character names violate domain requirements
      const input = {
        investorId: "usr_01HXYZ123456789",
        investorName: "S",
        investorEmail: "sofia.martinez@bluebrick.investments",
      };

      // Act
      // Step 2: Execute safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify rejection and specific error message
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorIssue = result.error.issues.find((issue) => issue.path.includes("investorName"));
        expect(errorIssue).toBeDefined();
        expect(errorIssue?.message).toBe("Investor name must be at least 2 characters");
      }
    });

    it("should reject malformed investorEmail with exact descriptive error", () => {
      // Arrange
      // Step 1: Construct invalid payload with non-email string
      // Edge Case: Email formatting error must not reach the SMTP client
      const input = {
        investorId: "usr_01HXYZ123456789",
        investorName: "Sofía Martínez",
        investorEmail: "not-a-valid-email-address",
      };

      // Act
      // Step 2: Execute safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify rejection and specific email format message
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorIssue = result.error.issues.find((issue) => issue.path.includes("investorEmail"));
        expect(errorIssue).toBeDefined();
        expect(errorIssue?.message).toBe("Invalid investor email format");
      }
    });

    it("should reject whitespace-only investorName as an invalid name", () => {
      // Arrange
      // Step 1: Provide whitespace-only name consisting of spaces
      // Edge Case: Whitespace padding should not satisfy min(2) character requirement
      const input = {
        investorId: "usr_01HXYZ123456789",
        investorName: "    ",
        investorEmail: "sofia.martinez@bluebrick.investments",
      };

      // Act
      // Step 2: Execute safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify schema rejects whitespace-only string
      expect(result.success).toBe(false);
    });

    it("should trim and normalize investorEmail to lowercase", () => {
      // Arrange
      // Step 1: Supply mixed-case email with surrounding whitespace
      // Edge Case: Email normalization prevents duplicate routing discrepancies
      const input = {
        investorId: "usr_01HXYZ123456789",
        investorName: "Sofía Martínez",
        investorEmail: "  SOFIA.MARTINEZ@BlueBrick.Investments  ",
      };

      // Act
      // Step 2: Execute safeParse
      const result = investmentLeadSchema.safeParse(input);

      // Assert
      // Step 3: Verify normalized lowercase email output
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.investorEmail).toBe("sofia.martinez@bluebrick.investments");
      }
    });
  });

  // =========================================================================
  // Layer 3: Domain Email Templates
  // =========================================================================
  describe("Layer 3: Domain Email Templates - buildInvestmentLeadHtml & buildInvestmentLeadPlainText", () => {
    it("should render corporate dark-mode HTML containing investor facts and quick reply mailto link", () => {
      // Arrange
      // Step 1: Set up canonical verified lead payload
      const payload = { ...VALID_LEAD_PAYLOAD };

      // Act
      // Step 2: Generate HTML email template
      const html = buildInvestmentLeadHtml(payload);

      // Assert
      // Step 3: Verify key investor facts and interactive mailto link are rendered
      expect(html).toContain("Sofía Martínez");
      expect(html).toContain("sofia.martinez@bluebrick.investments");
      expect(html).toContain("Inversionista Privado");
      // Interactive CTA for operations team to reply directly
      expect(html).toContain("mailto:sofia.martinez@bluebrick.investments");
      // Corporate institutional branding present
      expect(html.toLowerCase()).toContain("bluebrick");
    });

    it("should sanitize dynamic investor inputs to prevent HTML/XSS injection vulnerabilities", () => {
      // Arrange
      // Step 1: Provide malicious script and event handler injection strings in payload
      // Edge Case: XSS vector in investorName or tier must be neutralized before HTML rendering
      const maliciousPayload: InvestmentLeadPayload = {
        investorId: "usr_malicious_01",
        investorName: "<script>alert('xss')</script>",
        investorEmail: "attacker@malicious.com",
        tier: "<img src=x onerror=alert(1)>",
        timestamp: "2026-09-01T12:00:00.000Z",
      };

      // Act
      // Step 2: Generate HTML template with unsanitized inputs
      const html = buildInvestmentLeadHtml(maliciousPayload);

      // Assert
      // Step 3: Raw executable HTML tags must be neutralized and escaped
      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).not.toContain("<img src=x onerror=alert(1)>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("should generate clean plain-text fallback containing all investor facts and timestamp", () => {
      // Arrange
      // Step 1: Set up verified lead payload
      const payload = { ...VALID_LEAD_PAYLOAD };

      // Act
      // Step 2: Generate plain-text email representation
      const text = buildInvestmentLeadPlainText(payload);

      // Assert
      // Step 3: Verify facts, timestamp, and institutional identifiers
      expect(text).toContain("Sofía Martínez");
      expect(text).toContain("sofia.martinez@bluebrick.investments");
      expect(text).toContain("Inversionista Privado");
      expect(text).toContain("2026-09-01");
    });

    it("should ensure plain-text template strictly contains no HTML tags", () => {
      // Arrange
      // Step 1: Set up verified lead payload
      const payload = { ...VALID_LEAD_PAYLOAD };

      // Act
      // Step 2: Generate plain text
      const text = buildInvestmentLeadPlainText(payload);

      // Assert
      // Step 3: Verify absence of any HTML element tags (<...>)
      // Edge Case: Plain-text MIME parts must remain strictly un-formatted text
      expect(text).not.toMatch(/<[^>]+>/);
    });
  });

  // =========================================================================
  // Layer 4: Infrastructure SMTP Client
  // =========================================================================
  describe("Layer 4: Infrastructure - sendSmtpEmail Client & Transporter Behavior", () => {
    it("should operate in dryRun mode when SMTP credentials are absent in configuration", async () => {
      // Arrange
      // Step 1: Prepare email parameters without credentials config
      const params = { ...VALID_EMAIL_PARAMS };
      const emptyConfig: Partial<SmtpConfig> = { auth: undefined };

      // Act
      // Step 2: Invoke sendSmtpEmail in dry-run mode
      const result = await sendSmtpEmail(params, emptyConfig);

      // Assert
      // Step 3: Verify safe dry-run fallback execution without external dispatch
      expect(result.dryRun).toBe(true);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should initialize nodemailer transporter and dispatch email when SMTP credentials are provided", async () => {
      // Arrange
      // Step 1: Configure explicit SMTP credentials and mock successful transporter delivery
      const params = { ...VALID_EMAIL_PARAMS };
      const config = { ...CONFIGURED_SMTP_CONFIG };
      mockSendMail.mockResolvedValueOnce({ messageId: "transporter-msg-99901" });

      // Act
      // Step 2: Dispatch email with active credentials
      const result = await sendSmtpEmail(params, config);

      // Assert
      // Step 3: Verify transporter instantiation with correct credentials
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "mail.bluebrick.capital",
          port: 465,
          secure: true,
          auth: {
            user: "leads@bluebrick.capital",
            pass: "corporate-secure-smtp-password-987",
          },
        })
      );

      // Step 4: Verify transporter sendMail execution and result metadata
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "contacto@bluebrick.capital",
          subject: "Nuevo Lead de Inversión - Sofía Martínez",
        })
      );
      expect(result.dryRun).toBe(false);
      expect(result.messageId).toBe("transporter-msg-99901");
      expect(result.success).toBe(true);
    });

    it("should gracefully catch transport errors and return failure result without leaking credentials", async () => {
      // Arrange
      // Step 1: Configure credentials and mock transport failure (e.g. connection timeout or auth error)
      // Edge Case: SMTP socket error or ECONNREFUSED must be caught gracefully without throwing unhandled rejections
      const params = { ...VALID_EMAIL_PARAMS };
      const config = { ...CONFIGURED_SMTP_CONFIG };
      mockSendMail.mockRejectedValueOnce(
        new Error("Connection failed: ECONNREFUSED mail.bluebrick.capital:465")
      );

      // Act
      // Step 2: Attempt email dispatch
      const result = await sendSmtpEmail(params, config);

      // Assert
      // Step 3: Verify structured error response and ensure credentials are never leaked
      expect(result.success).toBe(false);
      expect(result.dryRun).toBe(false);
      expect(result.error).toContain("ECONNREFUSED");
      expect(result.error).not.toContain("corporate-secure-smtp-password-987");
    });
  });

  // =========================================================================
  // Layer 2: Application Server Action
  // =========================================================================
  describe("Layer 2: Application - submitInvestmentLeadAction Server Action Behavior", () => {
    it("should reject unauthenticated requests immediately with UNAUTHENTICATED error and not dispatch email", async () => {
      // Arrange
      // Step 1: Mock WorkOS session to return null (unauthenticated visitor)
      // Authority Guard: Invariant - unauthenticated requests must be blocked before invoking SMTP
      vi.mocked(withAuth).mockResolvedValueOnce({ user: null } as any);
      vi.mocked(getAuthenticatedInvestor).mockRejectedValueOnce(new Error("UNAUTHENTICATED"));

      // Act
      // Step 2: Invoke Server Action without authenticated session
      const result = await submitInvestmentLeadAction();

      // Assert
      // Step 3: Verify rejection and confirm no SMTP dispatch occurred
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/UNAUTHENTICATED|UNAUTHORIZED/i);
      expect(sendSmtpEmail).not.toHaveBeenCalled();
    });

    it("should validate session, orchestrate domain pipeline, and dispatch email to contacto@bluebrick.capital", async () => {
      // Arrange
      // Step 1: Mock active authenticated WorkOS investor session
      const mockInvestor = {
        id: "usr_01HXYZ123456789",
        email: "sofia.martinez@bluebrick.investments",
        firstName: "Sofía",
        lastName: "Martínez",
        avatarUrl: null,
        tier: "Inversionista Privado",
        createdAt: new Date("2021-01-01"),
      };
      vi.mocked(withAuth).mockResolvedValueOnce({
        user: {
          id: mockInvestor.id,
          email: mockInvestor.email,
          firstName: mockInvestor.firstName,
          lastName: mockInvestor.lastName,
        },
      } as any);
      vi.mocked(getAuthenticatedInvestor).mockResolvedValueOnce(mockInvestor);

      // Act
      // Step 2: Invoke Server Action on behalf of authenticated investor
      const result = await submitInvestmentLeadAction({
        metadata: { source: "reinvestment_opportunities_cta" },
      });

      // Assert
      // Step 3: Verify action result and verify destination address and payload details in SMTP dispatch
      expect(result.success).toBe(true);
      expect(sendSmtpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "contacto@bluebrick.capital",
          subject: expect.stringMatching(/lead|inversión|sofía martínez/i),
          html: expect.stringContaining("sofia.martinez@bluebrick.investments"),
          text: expect.stringContaining("sofia.martinez@bluebrick.investments"),
        })
      );
    });

    it("should enforce rate-limiting / cooldown to prevent rapid duplicate submissions from the same session", async () => {
      // Arrange
      // Step 1: Mock active authenticated investor session
      // Anti-Flooding Guard: Invariant - duplicate submissions within cooldown window must be rejected
      const mockInvestor = {
        id: "usr_rate_limit_target_01",
        email: "investor.rapid@bluebrick.investments",
        firstName: "Carlos",
        lastName: "Gómez",
        avatarUrl: null,
        tier: "Inversionista Privado",
        createdAt: new Date("2021-01-01"),
      };
      vi.mocked(withAuth).mockResolvedValue({
        user: {
          id: mockInvestor.id,
          email: mockInvestor.email,
          firstName: mockInvestor.firstName,
          lastName: mockInvestor.lastName,
        },
      } as any);
      vi.mocked(getAuthenticatedInvestor).mockResolvedValue(mockInvestor);

      // Act
      // Step 2: Execute first submission (expected to succeed)
      const firstResult = await submitInvestmentLeadAction();

      // Step 3: Execute immediate second submission within cooldown window
      const secondResult = await submitInvestmentLeadAction();

      // Assert
      // Step 4: First submission succeeds; second submission is blocked by rate-limiting guard
      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toMatch(/RATE_LIMIT|COOLDOWN|DUPLICATE/i);

      // Step 5: Assert SMTP dispatch was only triggered once
      expect(sendSmtpEmail).toHaveBeenCalledTimes(1);
    });
  });
});
