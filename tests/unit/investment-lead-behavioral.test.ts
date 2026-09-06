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
import {
  submitInvestmentLeadAction,
  clearInvestmentLeadCooldowns,
} from "@/lib/auth/investment-actions";
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
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(withAuth).mockReset();
    vi.mocked(getAuthenticatedInvestor).mockReset();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });
    await clearInvestmentLeadCooldowns();
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

    it("should parse and validate enriched investorPhone, reinvestmentCapital, totalInvested, and currentInvestments (@spec BBC-020-SPEC-2-SCHEMA)", () => {
      // Arrange
      // Step 1: Construct enriched lead payload with contact and portfolio holdings
      const enrichedInput = {
        ...VALID_LEAD_PAYLOAD,
        investorPhone: "+57 300 123 4567",
        reinvestmentCapital: 25400,
        totalInvested: 163000,
        currentInvestments: [
          {
            propertyName: "Residencial Vista Norte",
            investedAmount: 45000,
            roi: 14.2,
            status: "activa",
          },
          {
            propertyName: "Torre Corporativa Sabana",
            investedAmount: 60000,
            roi: 11.8,
            status: "activa",
          },
        ],
      };

      // Act
      // Step 2: Validate against domain schema
      const result = investmentLeadSchema.safeParse(enrichedInput);

      // Assert
      // Step 3: Ensure all enriched fields are preserved and strictly typed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.investorPhone).toBe("+57 300 123 4567");
        expect(result.data.reinvestmentCapital).toBe(25400);
        expect(result.data.totalInvested).toBe(163000);
        expect(result.data.currentInvestments).toHaveLength(2);
        expect(result.data.currentInvestments?.[0]?.propertyName).toBe("Residencial Vista Norte");
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

    it("should render investor phone, reinvestment brief card, and current holdings breakdown in HTML email (@spec BBC-020-SPEC-2-HTML-TEMPLATE)", () => {
      // Arrange
      // Step 1: Set up enriched lead payload with contact and portfolio holdings
      const enrichedPayload: InvestmentLeadPayload = {
        ...VALID_LEAD_PAYLOAD,
        investorPhone: "+57 300 123 4567",
        reinvestmentCapital: 25400,
        totalInvested: 163000,
        currentInvestments: [
          {
            propertyName: "Residencial Vista Norte",
            investedAmount: 45000,
            roi: 14.2,
            status: "activa",
          },
          {
            propertyName: "Torre Corporativa Sabana",
            investedAmount: 60000,
            roi: 11.8,
            status: "activa",
          },
        ],
      };

      // Act
      // Step 2: Generate HTML email
      const html = buildInvestmentLeadHtml(enrichedPayload);

      // Assert
      // Step 3: Verify investor phone is rendered in contact card
      expect(html).toContain("Teléfono");
      expect(html).toContain("+57 300 123 4567");

      // Step 4: Verify reinvestment brief card is prominently displayed
      expect(html).toMatch(/Capital disponible para reinvertir|Capital para reinvertir/i);
      expect(html).toContain("25,400");

      // Step 5: Verify holdings table lists active properties and amounts
      expect(html).toMatch(/Inversiones Actuales|Portafolio Actual/i);
      expect(html).toContain("Residencial Vista Norte");
      expect(html).toContain("Torre Corporativa Sabana");
      expect(html).toContain("45,000");
      expect(html).toContain("60,000");
      expect(html).toContain("163,000");
    });

    it("should render phone, reinvestment brief, and current investments in plain text template (@spec BBC-020-SPEC-2-TEXT-TEMPLATE)", () => {
      // Arrange
      // Step 1: Set up enriched lead payload
      const enrichedPayload: InvestmentLeadPayload = {
        ...VALID_LEAD_PAYLOAD,
        investorPhone: "+57 300 123 4567",
        reinvestmentCapital: 25400,
        totalInvested: 163000,
        currentInvestments: [
          {
            propertyName: "Residencial Vista Norte",
            investedAmount: 45000,
            roi: 14.2,
            status: "activa",
          },
        ],
      };

      // Act
      // Step 2: Generate plain text
      const text = buildInvestmentLeadPlainText(enrichedPayload);

      // Assert
      // Step 3: Assert plain text representation
      expect(text).toContain("Teléfono: +57 300 123 4567");
      expect(text).toMatch(/Capital para reinvertir/i);
      expect(text).toContain("25,400");
      expect(text).toContain("Residencial Vista Norte");
      expect(text).toContain("45,000");
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
    it("should reject submission if payload is missing or has invalid email format (@spec BBC-020-SPEC-1)", async () => {
      // Arrange
      // Invariant: Unauthenticated requests without valid investor payload must fail fast
      vi.mocked(withAuth).mockResolvedValueOnce({ user: null } as any);
      vi.mocked(getAuthenticatedInvestor).mockRejectedValueOnce(new Error("UNAUTHENTICATED"));

      // Act
      // Step 1: Call action without payload or authenticated session
      const result = await submitInvestmentLeadAction();

      // Assert
      // Step 2: Confirm rejection without triggering SMTP
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/UNAUTHENTICATED|INVALID/i);
      expect(sendSmtpEmail).not.toHaveBeenCalled();
    });

    it("should route notification email to configurable LEAD_NOTIFICATION_EMAIL and accept connected investor payload (@spec BBC-020-SPEC-1)", async () => {
      // Arrange
      // Step 1: Configure destination recipient via environment variable
      const originalEnv = process.env.LEAD_NOTIFICATION_EMAIL;
      process.env.LEAD_NOTIFICATION_EMAIL = "jsosa@primalcodelab.com";

      // Step 2: Simulate unauthenticated WorkOS session (e.g. Server Action POST context in production/local)
      vi.mocked(withAuth).mockResolvedValueOnce({ user: null } as any);
      vi.mocked(getAuthenticatedInvestor).mockResolvedValueOnce({
        id: "usr_jsosa_test",
        email: "jsosa@primalcodelab.com",
        firstName: "Jeison",
        lastName: "Sosa",
        avatarUrl: null,
        tier: "Inversionista Privado",
        createdAt: new Date("2026-01-01"),
      });

      // Step 3: Connected investor payload supplied by dashboard
      const payload = {
        investorId: "usr_jsosa_test",
        investorEmail: "jsosa@primalcodelab.com",
        investorName: "Jeison Sosa",
        tier: "Inversionista Privado",
        metadata: { source: "dashboard_reinvestment_cta" },
      };

      try {
        // Act
        // Step 4: Invoke Server Action with connected investor payload
        const result = await submitInvestmentLeadAction(payload);

        // Assert
        // Step 5: Verify successful delivery to configured recipient with connected investor data
        expect(result.success).toBe(true);
        expect(sendSmtpEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "jsosa@primalcodelab.com", // Recipient must be the configured LEAD_NOTIFICATION_EMAIL
            replyTo: "jsosa@primalcodelab.com", // Reply-to must be the connected investor's email
            subject: expect.stringMatching(/lead|inversión|jeison sosa/i),
            html: expect.stringContaining("jsosa@primalcodelab.com"),
          })
        );
      } finally {
        // Restore environment
        if (originalEnv !== undefined) {
          process.env.LEAD_NOTIFICATION_EMAIL = originalEnv;
        } else {
          delete process.env.LEAD_NOTIFICATION_EMAIL;
        }
      }
    });

    it("should fall back to contacto@bluebrick.capital if LEAD_NOTIFICATION_EMAIL is unset (@spec BBC-020-SPEC-1)", async () => {
      // Arrange
      const originalEnv = process.env.LEAD_NOTIFICATION_EMAIL;
      delete process.env.LEAD_NOTIFICATION_EMAIL;

      const mockInvestor = {
        id: "usr_01HXYZ123456789",
        email: "sofia.martinez@bluebrick.investments",
        firstName: "Sofía",
        lastName: "Martínez",
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

      try {
        // Act
        const result = await submitInvestmentLeadAction({
          investorId: mockInvestor.id,
          investorEmail: mockInvestor.email,
          investorName: "Sofía Martínez",
          tier: mockInvestor.tier,
          metadata: { source: "reinvestment_opportunities_cta" },
        });

        // Assert
        expect(result.success).toBe(true);
        expect(sendSmtpEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "contacto@bluebrick.capital",
            replyTo: "sofia.martinez@bluebrick.investments",
          })
        );
      } finally {
        if (originalEnv !== undefined) {
          process.env.LEAD_NOTIFICATION_EMAIL = originalEnv;
        }
      }
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

    it("should accept enriched lead payload with phone, reinvestmentCapital, and currentInvestments and forward to SMTP (@spec BBC-020-SPEC-2-SERVER-ACTION)", async () => {
      // Arrange
      // Step 1: Construct enriched lead payload with phone, capital, and active portfolio items
      const payload = {
        investorId: "usr_enriched_01",
        investorName: "Jeison Sosa",
        investorEmail: "jsosa@primalcodelab.com",
        investorPhone: "+57 300 987 6543",
        reinvestmentCapital: 32000,
        totalInvested: 180000,
        currentInvestments: [
          {
            propertyName: "Bush Garden BG-01",
            investedAmount: 100000,
            roi: 16.0,
            status: "activa",
          },
        ],
      };

      // Act
      // Step 2: Execute server action with enriched payload
      const result = await submitInvestmentLeadAction(payload as any);

      // Assert
      // Step 3: Action succeeds and SMTP transport is invoked with phone and portfolio facts in HTML
      expect(result.success).toBe(true);
      expect(sendSmtpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          html: expect.stringContaining("+57 300 987 6543"),
        })
      );
    });
  });
});
