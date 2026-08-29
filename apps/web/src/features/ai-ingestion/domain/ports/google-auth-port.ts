/**
 * ============================================================================
 * Layer 3: Domain Port - Google Authentication
 * ============================================================================
 * Purpose: Define pure domain contracts and error types for Google Service
 * Account authentication. Strictly zero external SDK, crypto, or network dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Payload representing a validated OAuth2 Bearer Access Token.
 */
export interface AccessTokenPayload {
  /** The raw OAuth2 Bearer token string */
  readonly token: string;
  /** Expiration timestamp in UTC milliseconds (epoch ms) */
  readonly expiresAtUtc: number;
  /** Token type identifier, always 'Bearer' */
  readonly tokenType: 'Bearer';
}

/**
 * Specific error codes for domain-level Google Authentication failures.
 */
export type GoogleAuthErrorCode =
  | 'MISSING_CREDENTIALS'
  | 'MALFORMED_PRIVATE_KEY'
  | 'TOKEN_SIGNING_FAILED'
  | 'OAUTH_NETWORK_ERROR'
  | 'INVALID_GRANT'
  | 'RATE_LIMITED';

/**
 * Domain-specific error class for Google Authentication lifecycle events.
 */
export class GoogleAuthDomainError extends Error {
  /**
   * Constructs a typed GoogleAuthDomainError.
   * 
   * @param code - Categorized error code for deterministic handling
   * @param message - Descriptive, non-sensitive error explanation
   * @param retryable - Indicates whether caller can retry the operation with backoff
   * @param cause - Underlying error or cause if available (redacted)
   */
  constructor(
    public readonly code: GoogleAuthErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown
  ) {
    super(`[GoogleAuthError - ${code}] ${message}`);
    this.name = 'GoogleAuthDomainError';
  }
}

/**
 * Port contract for obtaining Google OAuth2 access tokens.
 */
export interface IGoogleAuthProviderPort {
  /**
   * Retrieves a valid Bearer access token for Google Drive operations.
   * Utilizes in-memory caching and single-flight concurrency deduplication.
   * 
   * @param forceRefresh - If true, bypasses the memory cache and requests a fresh token
   * @returns Promise resolving to the validated AccessTokenPayload
   * @throws {GoogleAuthDomainError} on configuration, signing, or network failures
   */
  getAccessToken(forceRefresh?: boolean): Promise<AccessTokenPayload>;

  /**
   * Clears any active in-memory cached token.
   */
  invalidateCache(): void;
}
