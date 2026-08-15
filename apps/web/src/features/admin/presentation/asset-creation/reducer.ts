import type { AssetCreationAction } from "@/components/admin/asset-creation/actions";
import { createInitialAssetCreationState, type AssetCreationState } from "@/components/admin/asset-creation/types";

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function assetCreationReducer(
  state: AssetCreationState,
  action: AssetCreationAction
): AssetCreationState {
  switch (action.type) {
    case "assetCreation/setFormField": {
      const { field, value } = action.payload;
      if (state.form[field] === value) {
        return state;
      }

      return {
        ...state,
        form: {
          ...state.form,
          [field]: value
        }
      };
    }

    case "assetCreation/setForm":
      return {
        ...state,
        form: action.payload
      };

    case "assetCreation/patchForm":
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload
        }
      };

    case "assetCreation/setFormStatus":
      return {
        ...state,
        formStatus: action.payload
      };

    case "assetCreation/setValidationErrors":
      return {
        ...state,
        validationErrors: dedupe(action.payload)
      };

    case "assetCreation/setCollectionNameManual":
      return {
        ...state,
        collectionNameManual: action.payload
      };

    case "assetCreation/setCollectionSymbolManual":
      return {
        ...state,
        collectionSymbolManual: action.payload
      };

    case "assetCreation/setImportInput":
      return {
        ...state,
        importText: action.payload.importText ?? state.importText,
        importFileName: action.payload.importFileName ?? state.importFileName,
        importFingerprint: action.payload.importFingerprint ?? state.importFingerprint,
        importPreviewCount: action.payload.importPreviewCount ?? state.importPreviewCount,
        importHeaders: action.payload.importHeaders ?? state.importHeaders,
        importMessage: action.payload.importMessage ?? state.importMessage,
        importSubmitting: action.payload.importSubmitting ?? state.importSubmitting
      };

    case "assetCreation/setImportJob":
      return {
        ...state,
        importJob: action.payload
      };

    case "assetCreation/setDragTargetField":
      return {
        ...state,
        dragTargetField: action.payload
      };

    case "assetCreation/patchUploadFieldState": {
      const { field, patch } = action.payload;
      return {
        ...state,
        uploadState: {
          ...state.uploadState,
          [field]: {
            ...state.uploadState[field],
            ...patch
          }
        }
      };
    }

    case "assetCreation/setUploadState":
      return {
        ...state,
        uploadState: action.payload
      };

    case "assetCreation/setUploadFieldRefs": {
      const { field, refs } = action.payload;
      return {
        ...state,
        uploadRefs: {
          ...state.uploadRefs,
          [field]: refs
        }
      };
    }

    case "assetCreation/setUploadRefs":
      return {
        ...state,
        uploadRefs: action.payload
      };

    case "assetCreation/setMintQuantity":
      return {
        ...state,
        mintQuantity: action.payload
      };

    case "assetCreation/setShowMintSetup":
      return {
        ...state,
        showMintSetup: action.payload
      };

    case "assetCreation/setDeployCompletedData":
      return {
        ...state,
        deployCompletedData: action.payload
      };

    case "assetCreation/setSnapshotFinalize":
      return {
        ...state,
        snapshotFinalize: action.payload
      };

    case "assetCreation/setCreateAssetFlow":
      return {
        ...state,
        createAssetMessage: action.payload.createAssetMessage ?? state.createAssetMessage,
        isCreatingMarketplaceEntry: action.payload.isCreatingMarketplaceEntry ?? state.isCreatingMarketplaceEntry,
        createdMarketplaceEntryId: typeof action.payload.createdMarketplaceEntryId === "undefined"
          ? state.createdMarketplaceEntryId
          : action.payload.createdMarketplaceEntryId
      };

    case "assetCreation/resetState":
      return createInitialAssetCreationState(action.payload.draftId);

    default:
      return state;
  }
}
