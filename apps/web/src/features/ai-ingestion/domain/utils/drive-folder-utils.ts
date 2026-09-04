/**
 * @file apps/web/src/features/ai-ingestion/domain/utils/drive-folder-utils.ts
 * @layer Layer 3: Domain — Google Drive Folder Extraction & Detection Utilities.
 *
 * @description Pure domain utility functions to detect, sanitize, and extract
 * Google Drive folder identifiers from spreadsheet cell inputs, raw URLs, or IDs.
 *
 * @security
 *  - Strips spreadsheet formula injection single-quote prefixes ('=, '+, etc.).
 *  - Strips extraneous query parameters and path traversals.
 *  - Bounded string length to prevent regex Denial of Service (ReDoS).
 *
 * @invariants
 *  - Google Drive folder IDs are alphanumeric strings with '-' and '_', typically 25 to 50 characters.
 *  - Single file links (/file/d/...) MUST NOT be classified as folders.
 *
 * @spec BBC-8-SPEC-1-FOLDER-EXTRACTION
 */

/**
 * Regex matching standard Google Drive folder URLs.
 * Matches:
 *  - https://drive.google.com/drive/folders/{folderId}
 *  - https://drive.google.com/drive/u/{n}/folders/{folderId}
 */
const DRIVE_FOLDER_URL_REGEX =
  /(?:https?:\/\/)?drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]{15,100})/i;

/**
 * Regex matching open?id={folderId} or open?id={folderId}&... links.
 */
const DRIVE_OPEN_ID_REGEX =
  /(?:https?:\/\/)?drive\.google\.com\/open\?(?:[^&]*&)*id=([a-zA-Z0-9_-]{15,100})/i;

/**
 * Regex matching naked Drive folder IDs (standalone alphanumeric token 15-100 chars).
 */
const RAW_DRIVE_FOLDER_ID_REGEX = /^[a-zA-Z0-9_-]{15,100}$/;

/**
 * Negative check for Google Drive file links to prevent mistaking single files for folders.
 */
const DRIVE_FILE_URL_REGEX = /(?:https?:\/\/)?drive\.google\.com\/file\/d\//i;

/**
 * Extracts a Google Drive folder ID from an arbitrary cell value or URL.
 *
 * @param input - The raw cell string, URL, or identifier
 * @returns Sanitized folder ID string, or null if the input is not a recognized Drive folder
 *
 * @example
 * ```ts
 * extractDriveFolderId("https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl");
 * // => "1ABC_xyz-1234567890abcdefghijkl"
 * ```
 */
export function extractDriveFolderId(input: string | null | undefined): string | null {
  // Step 1: Guard against null, undefined, or empty/whitespace values
  if (!input || typeof input !== "string") {
    return null;
  }

  // Step 2: Strip leading formula sanitization quote and trim whitespace
  let cleanInput = input.trim();
  if (cleanInput.startsWith("'")) {
    cleanInput = cleanInput.slice(1).trim();
  }

  if (cleanInput.length === 0 || cleanInput.length > 500) {
    return null;
  }

  // Step 3: Explicitly reject single-file Drive links
  if (DRIVE_FILE_URL_REGEX.test(cleanInput)) {
    return null;
  }

  // Step 4: Check standard /folders/{id} pattern
  const folderMatch = cleanInput.match(DRIVE_FOLDER_URL_REGEX);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Step 5: Check open?id={id} pattern
  const openMatch = cleanInput.match(DRIVE_OPEN_ID_REGEX);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // Step 6: Check raw alphanumeric Drive ID (standalone token without protocol)
  if (!cleanInput.includes("/") && !cleanInput.includes(":") && RAW_DRIVE_FOLDER_ID_REGEX.test(cleanInput)) {
    return cleanInput;
  }

  // Step 7: Not a recognized Drive folder format
  return null;
}

/**
 * Evaluates whether an input represents a Google Drive folder reference.
 *
 * @param input - The raw string to inspect
 * @returns True if the string is a valid Google Drive folder URL or ID
 */
export function isDriveFolderReference(input: string | null | undefined): boolean {
  // Step 1: Delegate to extractDriveFolderId and verify non-null return
  return extractDriveFolderId(input) !== null;
}
