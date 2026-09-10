/**
 * ============================================================================
 * @file scripts/google-drive/apps-script-webhook.js
 * @description Operational Template - Google Apps Script Trailing-Edge Webhook
 * ============================================================================
 * Purpose: Provides a production-ready Google Apps Script template for trailing-edge
 * debounce dispatch to BlueBrick. When users make edits in Google Drive / Google Sheets,
 * this script consolidates rapid modifications into a single trailing-edge webhook call
 * after a configurable cooldown window (e.g. 30 minutes of inactivity).
 *
 * Invariants & Architecture:
 *  - Free Google Compute: Timer runs inside Google Apps Script ScriptApp triggers,
 *    incurring zero Vercel Serverless compute or cron quotas while waiting.
 *  - True Trailing-Edge Debounce: Each new modification cancels prior pending triggers
 *    and reschedules a single fresh timer for now + cooldownMinutes.
 *  - Secure Authentication: Transmits the shared secret in the custom HTTP header
 *    'x-bluebrick-webhook-secret' matching DRIVE_WEBHOOK_SECRET.
 *  - Compatible with Google Apps Script V8 runtime and Node.js test runners.
 *
 * Installation in Google Sheets / Google Drive:
 *  1. Open target Google Sheet -> Extensions -> Apps Script (script.google.com).
 *  2. Paste the contents of this file into Code.gs.
 *  3. In Project Settings -> Script Properties, define:
 *     - BLUEBRICK_WEBHOOK_URL: e.g. "https://bluebrick.investments/api/webhooks/google-drive"
 *     - BLUEBRICK_WEBHOOK_SECRET: (matching DRIVE_WEBHOOK_SECRET in .env)
 *     - COOLDOWN_MINUTES: (optional, defaults to "30")
 *  4. In Triggers -> Add Trigger:
 *     - Function: onSheetEditTrigger
 *     - Event source: From spreadsheet -> On edit (or On change)
 *
 * @spec BBC-021
 */

/** Handler name for the debounced webhook dispatcher */
var DEBOUNCE_HANDLER_FUNCTION = "sendDebouncedWebhook";

/** Script Property key for storing pending target file metadata */
var PROPERTY_PENDING_FILE_ID = "PENDING_FILE_ID";

/**
 * Safe logging helper that outputs to Logger in Google Apps Script or console in Node.js.
 *
 * @param {string} msg - Message to log
 */
function logMessage(msg) {
  if (typeof Logger !== "undefined" && typeof Logger.log === "function") {
    Logger.log(msg);
  } else if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log(msg);
  }
}

/**
 * Retrieves a script configuration property from Google Apps Script PropertiesService.
 *
 * @param {string} key - Property name
 * @param {string} [defaultValue] - Fallback value if unset
 * @returns {string} Configured property value
 */
function getScriptConfig(key, defaultValue) {
  // Step 1: Read property from Google Apps Script script storage
  var props = PropertiesService.getScriptProperties();
  var value = props.getProperty(key);
  if (value !== null && value !== undefined && value.trim() !== "") {
    return value.trim();
  }
  return defaultValue !== undefined ? defaultValue : "";
}

/**
 * Cancels all currently scheduled triggers matching a specific handler function name.
 * Prevents timer accumulation and guarantees a single trailing-edge timer exists.
 *
 * @param {string} handlerName - Name of the Apps Script function to cancel
 */
function cancelScheduledTriggers(handlerName) {
  // Step 1: Query all project triggers
  var allTriggers = ScriptApp.getProjectTriggers();

  // Step 2: Iterate backward and delete matching trigger instances safely
  for (var i = allTriggers.length - 1; i >= 0; i--) {
    if (allTriggers[i].getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
}

/**
 * Schedules a trailing-edge debounced synchronization trigger in Google Apps Script.
 * Cancels any prior scheduled triggers and sets a new one for cooldownMinutes in the future.
 *
 * @param {string} [fileId] - Optional Google Drive file identifier
 */
function scheduleDebouncedSync(fileId) {
  // Step 1: Resolve configured cooldown duration (default: 30 minutes)
  var cooldownMinutesStr = getScriptConfig("COOLDOWN_MINUTES", "30");
  var cooldownMinutes = parseInt(cooldownMinutesStr, 10);
  if (isNaN(cooldownMinutes) || cooldownMinutes <= 0) {
    cooldownMinutes = 30;
  }

  // Step 2: Cancel all previous debounced triggers to ensure true trailing-edge accumulation
  cancelScheduledTriggers(DEBOUNCE_HANDLER_FUNCTION);

  // Step 3: Record pending file metadata in script properties
  if (fileId) {
    PropertiesService.getScriptProperties().setProperty(PROPERTY_PENDING_FILE_ID, fileId);
  }

  // Step 4: Schedule new time-based trigger for cooldownMinutes in the future
  var delayMs = cooldownMinutes * 60 * 1000;
  ScriptApp.newTrigger(DEBOUNCE_HANDLER_FUNCTION)
    .timeBased()
    .after(delayMs)
    .create();

  logMessage(
    "[BlueBrick Webhook] Scheduled trailing-edge sync in " +
      cooldownMinutes +
      " minutes (" +
      delayMs +
      "ms) for file " +
      (fileId || "DEFAULT")
  );
}

/**
 * Dispatches an authenticated HTTP POST webhook to BlueBrick.
 *
 * @param {string} source - Trigger source descriptor (e.g. TRAILING_EDGE, MANUAL)
 * @param {string} [fileId] - Google Drive file identifier
 * @returns {object} Parsed JSON response from BlueBrick API
 */
function executeWebhookPost(source, fileId) {
  // Step 1: Validate required endpoint URL and secret credentials
  var webhookUrl = getScriptConfig("BLUEBRICK_WEBHOOK_URL") || getScriptConfig("WEBHOOK_URL");
  var webhookSecret = getScriptConfig("DRIVE_WEBHOOK_SECRET") || getScriptConfig("BLUEBRICK_WEBHOOK_SECRET");

  if (!webhookUrl) {
    throw new Error(
      "[BlueBrick Webhook] BLUEBRICK_WEBHOOK_URL is not configured in Script Properties."
    );
  }
  if (!webhookSecret) {
    throw new Error(
      "[BlueBrick Webhook] DRIVE_WEBHOOK_SECRET (or BLUEBRICK_WEBHOOK_SECRET) is not configured in Script Properties."
    );
  }

  // Step 2: Assemble payload
  var payload = {
    source: source,
    fileId: fileId || null,
    timestamp: new Date().toISOString(),
  };

  // Step 3: Build HTTP request options with custom secret header
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-bluebrick-webhook-secret": webhookSecret,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  // Step 4: Dispatch request via UrlFetchApp
  var response = UrlFetchApp.fetch(webhookUrl, options);
  var statusCode = response.getResponseCode();
  var contentText = response.getContentText();

  logMessage(
    "[BlueBrick Webhook] Dispatched " +
      source +
      " webhook to " +
      webhookUrl +
      ". Status: " +
      statusCode +
      ". Response: " +
      contentText
  );

  return {
    statusCode: statusCode,
    body: contentText,
  };
}

/**
 * Triggered automatically by ScriptApp when the debounced cooldown timer expires.
 * Dispatches the trailing-edge webhook and cleans up script state.
 */
function sendDebouncedWebhook() {
  // Step 1: Retrieve pending file ID
  var props = PropertiesService.getScriptProperties();
  var pendingFileId = props.getProperty(PROPERTY_PENDING_FILE_ID);

  try {
    // Step 2: Dispatch trailing-edge webhook call
    executeWebhookPost("GOOGLE_APPS_SCRIPT_TRAILING_EDGE", pendingFileId);
  } finally {
    // Step 3: Clean up triggers and pending state
    cancelScheduledTriggers(DEBOUNCE_HANDLER_FUNCTION);
    props.deleteProperty(PROPERTY_PENDING_FILE_ID);
  }
}

/**
 * Immediate manual webhook trigger for administrative testing or instant sync button.
 *
 * @param {string} [fileId] - Target spreadsheet file ID
 */
function sendImmediateWebhook(fileId) {
  return executeWebhookPost("GOOGLE_APPS_SCRIPT_MANUAL", fileId);
}

/**
 * Event listener triggered by Google Sheets on edit.
 * Wire this to an Installable 'On edit' or 'On change' trigger in the Apps Script dashboard.
 *
 * @param {object} [e] - Google Sheets event object
 */
function onSheetEditTrigger(e) {
  var fileId = null;
  try {
    if (typeof SpreadsheetApp !== "undefined") {
      fileId = SpreadsheetApp.getActiveSpreadsheet().getId();
    }
  } catch (err) {
    // Non-fatal if invoked outside bound spreadsheet
  }
  scheduleDebouncedSync(fileId);
}

/**
 * Google Sheets custom menu initialization. Adds 'BlueBrick Ingestión' toolbar.
 */
function onOpen() {
  if (typeof SpreadsheetApp !== "undefined") {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("BlueBrick Ingestión")
      .addItem("Sincronizar Ahora (Inmediato)", "menuSyncImmediate")
      .addItem("Programar Sincronización (30 min)", "menuScheduleDebounce")
      .addToUi();
  }
}

/** Toolbar callback: Trigger immediate sync */
function menuSyncImmediate() {
  var fileId = SpreadsheetApp.getActiveSpreadsheet().getId();
  var res = sendImmediateWebhook(fileId);
  SpreadsheetApp.getUi().alert(
    "Sincronización BlueBrick",
    "Resultado HTTP: " + res.statusCode + "\n" + res.body,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/** Toolbar callback: Schedule debounced sync */
function menuScheduleDebounce() {
  var fileId = SpreadsheetApp.getActiveSpreadsheet().getId();
  scheduleDebouncedSync(fileId);
  SpreadsheetApp.getUi().alert(
    "Sincronización BlueBrick",
    "Sincronización programada en 30 minutos a partir del último cambio.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// Export for Node.js / Vitest unit testing without breaking Google Apps Script runtime
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    scheduleDebouncedSync: scheduleDebouncedSync,
    sendDebouncedWebhook: sendDebouncedWebhook,
    sendImmediateWebhook: sendImmediateWebhook,
    onSheetEditTrigger: onSheetEditTrigger,
    onOpen: onOpen,
    cancelScheduledTriggers: cancelScheduledTriggers,
    getScriptConfig: getScriptConfig,
    executeWebhookPost: executeWebhookPost,
  };
}
