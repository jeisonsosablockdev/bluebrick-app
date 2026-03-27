import type { AssetCreationState, AssetForm, TypeFormState } from "@/components/admin/asset-creation/types";

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

export function selectDerivedMintQuantityFromType(form: AssetForm): number | null {
  if (form.assetType !== "building_new") {
    return null;
  }

  const parsed = Number(form.buildingTotalUnits);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.floor(parsed);
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
