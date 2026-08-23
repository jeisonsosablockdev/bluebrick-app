import type { AssetCreationState, AssetForm, TypeFormState } from "@/features/admin/presentation/asset-creation/types";

export function toSafeNonNegativeInteger(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

export function dedupeValidationErrors(errors: string[]): string[] {
  return Array.from(new Set(errors.map((item) => item.trim()).filter(Boolean)));
}

export function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function deriveProjectDurationMonths(startDateRaw: string, deliveryDateRaw: string): string {
  if (!startDateRaw || !deliveryDateRaw) {
    return "";
  }

  const startDate = Date.parse(`${startDateRaw}T00:00:00Z`);
  const deliveryDate = Date.parse(`${deliveryDateRaw}T00:00:00Z`);
  if (!Number.isFinite(startDate) || !Number.isFinite(deliveryDate) || deliveryDate < startDate) {
    return "";
  }

  const dayInMs = 1000 * 60 * 60 * 24;
  const averageMonthInDays = 30.4375;
  const diffDays = (deliveryDate - startDate) / dayInMs;
  const months = Math.max(1, Math.ceil(diffDays / averageMonthInDays));
  return String(months);
}

export function selectDerivedMintQuantityFromType(form: AssetForm): number | null {
  if (form.assetType !== "building_new") {
    return null;
  }

  const parsed = Number(form.buildingTotalUnits);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return toSafeNonNegativeInteger(parsed);
}

export function selectMintQuantityValue(state: AssetCreationState): number {
  const derived = selectDerivedMintQuantityFromType(state.form);
  if (typeof derived === "number") {
    return Math.max(0, derived);
  }

  const fallback = Number(state.mintQuantity);
  if (!Number.isFinite(fallback)) {
    return 0;
  }

  return Math.max(0, Math.floor(fallback));
}

export function selectSnapshotFormData(state: AssetCreationState): Record<string, unknown> {
  return {
    ...state.form,
    draftId: state.draftId,
    formStatus: state.formStatus,
    mintQuantity: selectMintQuantityValue(state),
    uploadRefs: state.uploadRefs
  };
}

export function selectCanContinueToMint(input: {
  requiredErrors: string[];
  typeValidationState: TypeFormState;
  compatibilityErrors: string[];
}): boolean {
  return (
    input.requiredErrors.length === 0
    && input.typeValidationState === "valid"
    && input.compatibilityErrors.length === 0
  );
}
