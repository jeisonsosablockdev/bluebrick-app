import { describe, expect, it } from "vitest";

import {
  assetCreationReducer,
  createInitialAssetCreationState,
  dedupeValidationErrors,
  patchUploadFieldState,
  resetState,
  selectCanContinueToMint,
  selectDerivedMintQuantityFromType,
  selectMintQuantityValue,
  selectSnapshotFormData,
  setForm,
  setFormField,
  setUploadRefs,
  setUploadState
} from "@/components/admin/asset-creation";

describe("asset creation canonical state", () => {
  it("creates a deterministic initial state with provided draftId", () => {
    const state = createInitialAssetCreationState("draft-123");

    expect(state.draftId).toBe("draft-123");
    expect(state.form.assetType).toBe("");
    expect(state.formStatus).toBe("draft");
    expect(state.uploadState.coverImage.uploading).toBe(false);
    expect(state.uploadRefs.galleryImages).toEqual([]);
  });

  it("updates form fields through reducer actions", () => {
    const initial = createInitialAssetCreationState("draft-1");
    const next = assetCreationReducer(initial, setFormField("assetName", "Torre Marina"));

    expect(next.form.assetName).toBe("Torre Marina");
    expect(initial.form.assetName).toBe("");
  });

  it("patches upload field state without mutating sibling fields", () => {
    const initial = createInitialAssetCreationState("draft-1");
    const next = assetCreationReducer(
      initial,
      patchUploadFieldState("coverImage", { uploading: true, message: "Uploading..." })
    );

    expect(next.uploadState.coverImage.uploading).toBe(true);
    expect(next.uploadState.coverImage.message).toBe("Uploading...");
    expect(next.uploadState.galleryImages.uploading).toBe(false);
  });

  it("resets all state slices to initial defaults with new draftId", () => {
    const initial = createInitialAssetCreationState("draft-1");
    const dirty = assetCreationReducer(initial, setFormField("assetName", "Name A"));
    const reset = assetCreationReducer(dirty, resetState("draft-2"));

    expect(reset.draftId).toBe("draft-2");
    expect(reset.form.assetName).toBe("");
    expect(reset.validationErrors).toEqual([]);
  });

  it("replaces form and upload slices through canonical replace actions", () => {
    const initial = createInitialAssetCreationState("draft-1");
    const nextForm = { ...initial.form, assetName: "Proyecto X", country: "CO" };
    const withForm = assetCreationReducer(initial, setForm(nextForm));
    const withUploadState = assetCreationReducer(
      withForm,
      setUploadState({
        ...withForm.uploadState,
        coverImage: {
          uploading: true,
          message: "Uploading...",
          error: ""
        }
      })
    );
    const withUploadRefs = assetCreationReducer(
      withUploadState,
      setUploadRefs({
        ...withUploadState.uploadRefs,
        coverImage: ["file-ref-1"]
      })
    );

    expect(withForm.form).toEqual(nextForm);
    expect(withUploadState.uploadState.coverImage.uploading).toBe(true);
    expect(withUploadRefs.uploadRefs.coverImage).toEqual(["file-ref-1"]);
  });
});

describe("asset creation selectors", () => {
  it("derives mint quantity from building total units when asset type is building_new", () => {
    const state = createInitialAssetCreationState("draft-1");
    const withType = assetCreationReducer(state, setFormField("assetType", "building_new"));
    const withUnits = assetCreationReducer(withType, setFormField("buildingTotalUnits", "12"));

    expect(selectDerivedMintQuantityFromType(withUnits.form)).toBe(12);
    expect(selectMintQuantityValue(withUnits)).toBe(12);
  });

  it("falls back to manual mint quantity for non-building asset types", () => {
    const state = createInitialAssetCreationState("draft-1");
    const withType = assetCreationReducer(state, setFormField("assetType", "land_lot"));
    const withQuantity = {
      ...withType,
      mintQuantity: "7"
    };

    expect(selectDerivedMintQuantityFromType(withQuantity.form)).toBeNull();
    expect(selectMintQuantityValue(withQuantity)).toBe(7);
  });

  it("builds snapshot payload contract from canonical state", () => {
    const state = createInitialAssetCreationState("draft-9");
    const withName = assetCreationReducer(state, setFormField("assetName", "Proyecto A"));
    const snapshot = selectSnapshotFormData(withName);

    expect(snapshot.draftId).toBe("draft-9");
    expect(snapshot.assetName).toBe("Proyecto A");
    expect(snapshot.mintQuantity).toBe(1);
  });

  it("dedupes validation errors and computes continuation guard", () => {
    expect(dedupeValidationErrors(["a", "a", " b ", ""])).toEqual(["a", "b"]);

    expect(
      selectCanContinueToMint({
        requiredErrors: [],
        typeValidationState: "valid",
        compatibilityErrors: []
      })
    ).toBe(true);

    expect(
      selectCanContinueToMint({
        requiredErrors: ["missing country"],
        typeValidationState: "valid",
        compatibilityErrors: []
      })
    ).toBe(false);
  });
});
