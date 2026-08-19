/**
 * TDD Primal — RED Phase
 * @spec BRI-154 § UX Error Messages, Navigation Utils, Path Building
 *
 * Estas pruebas verifican el comportamiento de las utilidades puras que
 * serán extraídas a features/navigation/application/nav-modal-utils.ts.
 *
 * ESTADO: RED — las funciones aún viven en el monolito.
 * Al extraerlas a su módulo de destino, los imports se actualizan y los
 * tests deben pasar sin modificar las aserciones.
 */

import { describe, expect, it } from "vitest";

import {
  getFriendlyWalletErrorMessage,
  getStatusText,
  getWalletIntentPrimaryLabel,
  isActivePath,
  buildPathWithQueryParam,
  buildPathWithoutQueryParam,
  truncatePublicKey,
  adapterSupportsMessageSigning,
} from "../../apps/web/src/features/navigation/application/nav-modal-utils";

// ---------------------------------------------------------------------------
// Stub mínimo del helper de traducción (no mockea el SUT)
// ---------------------------------------------------------------------------
const identity = (text: { en: string }): string => text.en;

// ===========================================================================
// truncatePublicKey
// ===========================================================================
describe("truncatePublicKey", () => {
  it("given_32char_key_then_returns_4_dots_4_format", () => {
    const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
    expect(truncatePublicKey(key)).toBe("ABCD...cdef");
  });

  it("given_exact_8char_key_then_full_key_shown", () => {
    const key = "12345678";
    expect(truncatePublicKey(key)).toBe("1234...5678");
  });
});

// ===========================================================================
// buildPathWithQueryParam / buildPathWithoutQueryParam
// ===========================================================================
describe("buildPathWithQueryParam", () => {
  it("given_no_existing_params_then_adds_param", () => {
    const result = buildPathWithQueryParam("/profile", new URLSearchParams(), "ref", "ABC123");
    expect(result).toBe("/profile?ref=ABC123");
  });

  it("given_existing_params_then_adds_without_dropping_others", () => {
    const params = new URLSearchParams("locale=es");
    const result = buildPathWithQueryParam("/profile", params, "ref", "ABC123");
    expect(result).toBe("/profile?locale=es&ref=ABC123");
  });

  it("given_existing_same_param_then_overwrites_it", () => {
    const params = new URLSearchParams("ref=OLD");
    const result = buildPathWithQueryParam("/profile", params, "ref", "NEW");
    expect(result).toBe("/profile?ref=NEW");
  });
});

describe("buildPathWithoutQueryParam", () => {
  it("given_param_present_then_removes_it", () => {
    const params = new URLSearchParams("postAuthDecision=1&locale=es");
    const result = buildPathWithoutQueryParam("/profile", params, "postAuthDecision");
    expect(result).toBe("/profile?locale=es");
  });

  it("given_no_remaining_params_then_returns_bare_path", () => {
    const params = new URLSearchParams("postAuthDecision=1");
    const result = buildPathWithoutQueryParam("/profile", params, "postAuthDecision");
    expect(result).toBe("/profile");
  });

  it("given_param_not_present_then_returns_path_unchanged", () => {
    const params = new URLSearchParams("locale=en");
    const result = buildPathWithoutQueryParam("/profile", params, "ref");
    expect(result).toBe("/profile?locale=en");
  });
});

// ===========================================================================
// isActivePath
// ===========================================================================
describe("isActivePath", () => {
  it("given_root_href_then_only_exact_match_is_active", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/marketplace", "/")).toBe(false);
  });

  it("given_non_root_href_then_prefix_match_is_active", () => {
    expect(isActivePath("/profile/portfolio", "/profile")).toBe(true);
    expect(isActivePath("/profile", "/profile")).toBe(true);
  });

  it("given_partial_segment_overlap_then_not_active", () => {
    expect(isActivePath("/profiles", "/profile")).toBe(false);
  });
});

// ===========================================================================
// getStatusText
// ===========================================================================
describe("getStatusText", () => {
  it("given_idle_phase_then_returns_null", () => {
    expect(getStatusText("idle", identity)).toBeNull();
  });

  it("given_connecting_phase_then_returns_connecting_string", () => {
    const result = getStatusText("connecting", identity);
    expect(result).toContain("Connecting");
  });

  it("given_signing_phase_then_returns_signing_string", () => {
    expect(getStatusText("signing", identity)).toContain("Signing");
  });

  it("given_verifying_phase_then_returns_verifying_string", () => {
    expect(getStatusText("verifying", identity)).toContain("Verifying");
  });

  it("given_disconnecting_phase_then_returns_disconnecting_string", () => {
    expect(getStatusText("disconnecting", identity)).toContain("Disconnecting");
  });
});

// ===========================================================================
// getWalletIntentPrimaryLabel
// ===========================================================================
describe("getWalletIntentPrimaryLabel", () => {
  it("given_idle_not_connected_no_session_then_returns_connect_phantom", () => {
    const label = getWalletIntentPrimaryLabel({
      phase: "idle",
      hasWalletSession: false,
      isConnected: false,
      t: identity,
    });
    expect(label).toContain("Connect Phantom");
  });

  it("given_idle_connected_no_session_then_returns_request_signature", () => {
    const label = getWalletIntentPrimaryLabel({
      phase: "idle",
      hasWalletSession: false,
      isConnected: true,
      t: identity,
    });
    expect(label).toContain("Request signature");
  });

  it("given_idle_has_session_not_connected_then_returns_reconnect", () => {
    const label = getWalletIntentPrimaryLabel({
      phase: "idle",
      hasWalletSession: true,
      isConnected: false,
      t: identity,
    });
    expect(label).toContain("Reconnect");
  });

  it("given_signing_phase_then_returns_waiting_for_confirmation", () => {
    const label = getWalletIntentPrimaryLabel({
      phase: "signing",
      hasWalletSession: false,
      isConnected: true,
      t: identity,
    });
    expect(label).toContain("Waiting");
  });
});

// ===========================================================================
// getFriendlyWalletErrorMessage
// ===========================================================================
describe("getFriendlyWalletErrorMessage", () => {
  it("given_non_error_object_then_returns_generic_message", () => {
    const result = getFriendlyWalletErrorMessage("string error", identity);
    expect(result).toContain("Something went wrong");
  });

  it("given_rejected_error_then_returns_cancelled_message", () => {
    const result = getFriendlyWalletErrorMessage(new Error("User rejected"), identity);
    expect(result).toContain("cancelled");
  });

  it("given_cancelled_error_then_returns_cancelled_message", () => {
    const result = getFriendlyWalletErrorMessage(new Error("Transaction cancelled"), identity);
    expect(result).toContain("cancelled");
  });

  it("given_wallet_not_found_error_then_returns_phantom_not_found", () => {
    const result = getFriendlyWalletErrorMessage(new Error("wallet not found"), identity);
    expect(result).toContain("Phantom");
  });

  it("given_public_key_unavailable_error_then_returns_key_error", () => {
    const result = getFriendlyWalletErrorMessage(new Error("public key is unavailable"), identity);
    expect(result).toContain("public key");
  });

  it("given_message_signing_not_supported_then_returns_signing_error", () => {
    const result = getFriendlyWalletErrorMessage(new Error("does not support message signing"), identity);
    expect(result).toContain("signing");
  });

  it("given_authentication_failed_error_then_returns_auth_failed", () => {
    const result = getFriendlyWalletErrorMessage(new Error("authentication failed"), identity);
    expect(result).toContain("Authentication failed");
  });

  it("given_unknown_error_message_then_returns_raw_error_message", () => {
    const result = getFriendlyWalletErrorMessage(new Error("some custom error"), identity);
    expect(result).toBe("some custom error");
  });

  // Fault injection: verifica que el test NO pasaría si la función devolviera siempre el mensaje genérico
  it("fault_injection_rejected_error_must_not_return_generic", () => {
    const result = getFriendlyWalletErrorMessage(new Error("User rejected the request"), identity);
    expect(result).not.toContain("Something went wrong");
  });
});

// ===========================================================================
// adapterSupportsMessageSigning
// ===========================================================================
describe("adapterSupportsMessageSigning", () => {
  it("given_adapter_with_signMessage_function_then_returns_true", () => {
    const adapter = { signMessage: async (msg: Uint8Array) => msg };
    expect(adapterSupportsMessageSigning(adapter)).toBe(true);
  });

  it("given_adapter_without_signMessage_then_returns_false", () => {
    const adapter = { publicKey: null };
    expect(adapterSupportsMessageSigning(adapter)).toBe(false);
  });

  it("given_null_adapter_then_returns_false", () => {
    expect(adapterSupportsMessageSigning(null)).toBe(false);
  });

  it("given_signMessage_not_a_function_then_returns_false", () => {
    const adapter = { signMessage: "not-a-function" };
    expect(adapterSupportsMessageSigning(adapter)).toBe(false);
  });
});
