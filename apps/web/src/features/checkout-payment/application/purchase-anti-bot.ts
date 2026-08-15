export {
  getPurchaseAntiBotConfig,
  parseEnvInt,
  PurchaseAntiBotError,
  type PurchaseAntiBotConfig,
  type PurchaseAntiBotErrorCode
} from "./anti-bot/config";

export {
  assertMatchingChallengeContext,
  buildPurchaseChallengeMessage,
  issuePurchaseChallenge,
  type IssuePurchaseChallengeInput,
  type IssuedPurchaseChallenge,
  type PurchaseChallengePayload
} from "./anti-bot/challenge-builder";

export { assertPurchaseRateLimit } from "./anti-bot/rate-limiter";

export {
  decodeSignature,
  verifyAndConsumePurchaseChallenge,
  type VerifyPurchaseChallengeInput
} from "./anti-bot/signature-verifier";
