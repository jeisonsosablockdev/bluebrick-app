import { describe, expect, it } from "vitest";

import {
  assetCreationReducer,
  createInitialAssetCreationState,
  dedupeValidationErrors,
  patchUploadFieldState,
  resetState,
  selectCanContinueToMint,
  deriveProjectDurationMonths,
  selectDerivedMintQuantityFromType,
  selectMintQuantityValue,
  selectSnapshotFormData,
  setCreateAssetFlow,
  setDeployCompletedData,
  setForm,
  setFormField,
  setShowMintSetup,
  setSnapshotFinalize,
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

  it("clears post-create marketplace and mint handoff state on reset", () => {
    const initial = createInitialAssetCreationState("draft-1");
    const withMintSetup = assetCreationReducer(initial, setShowMintSetup(true));
    const withDeploy = assetCreationReducer(withMintSetup, setDeployCompletedData({
      candyMachineAddress: "CandyMachine111111111111111111111111111111",
      collectionAddress: "Collection11111111111111111111111111111111",
      quantity: 3,
      signatures: []
    }));
    const withSnapshot = assetCreationReducer(withDeploy, setSnapshotFinalize({
      snapshotId: "snapshot-1",
      mintJobId: "mint-job-1",
      verificationStatus: "verified",
      verificationMethod: "candy_machine_items_loaded",
      marketplaceHandoffStatus: "ready",
      expectedQuantity: 3,
      foundAssets: 0,
      canCreateAsset: true,
      verificationError: null
    }));
    const withCreatedEntry = assetCreationReducer(withSnapshot, setCreateAssetFlow({
      createAssetMessage: "Entry created",
      createdMarketplaceEntryId: "entry-1"
    }));
    const withUploads = assetCreationReducer(withCreatedEntry, setUploadRefs({
      ...withCreatedEntry.uploadRefs,
      coverImage: ["blob-ref-1"]
    }));

    const reset = assetCreationReducer(withUploads, resetState("draft-2"));

    expect(reset.draftId).toBe("draft-2");
    expect(reset.showMintSetup).toBe(false);
    expect(reset.deployCompletedData).toBeNull();
    expect(reset.snapshotFinalize).toBeNull();
    expect(reset.createAssetMessage).toBe("");
    expect(reset.createdMarketplaceEntryId).toBeNull();
    expect(reset.uploadRefs.coverImage).toEqual([]);
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

  it("derives project duration months from construction start and delivery dates", () => {
    expect(deriveProjectDurationMonths("2026-01-01", "2026-07-01")).toBe("6");
    expect(deriveProjectDurationMonths("", "2026-07-01")).toBe("");
    expect(deriveProjectDurationMonths("2026-08-01", "2026-07-01")).toBe("");
  });
});
