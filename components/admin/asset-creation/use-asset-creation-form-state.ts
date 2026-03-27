"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  resetState,
  setCollectionNameManual as setCollectionNameManualAction,
  setCollectionSymbolManual as setCollectionSymbolManualAction,
  setCreateAssetFlow,
  setDeployCompletedData as setDeployCompletedDataAction,
  setDragTargetField as setDragTargetFieldAction,
  setForm as setFormAction,
  setFormStatus as setFormStatusAction,
  setImportInput,
  setImportJob as setImportJobAction,
  setMintQuantity as setMintQuantityAction,
  setShowMintSetup as setShowMintSetupAction,
  setSnapshotFinalize as setSnapshotFinalizeAction,
  setUploadRefs as setUploadRefsAction,
  setUploadState as setUploadStateAction,
  setValidationErrors as setValidationErrorsAction
} from "@/components/admin/asset-creation/actions";
import {
  assetCreationReducer
} from "@/components/admin/asset-creation/reducer";
import type { AssetCreationAction } from "@/components/admin/asset-creation/actions";
import type {
  AssetCreationState,
  AssetForm,
  FileUploadField,
  FormStatus,
  ImportJobTracker,
  UploadRefsState,
  UploadUiState
} from "@/components/admin/asset-creation/types";
import {
  createInitialAssetCreationState
} from "@/components/admin/asset-creation/types";

type SetStateAction<T> = T | ((prev: T) => T);

function resolveSetStateAction<T>(value: SetStateAction<T>, previous: T): T {
  if (typeof value === "function") {
    return (value as (prev: T) => T)(previous);
  }

  return value;
}

type AssetCreationFormStateApi = AssetCreationState & {
  setForm: (value: SetStateAction<AssetForm>) => void;
  setFormStatus: (value: SetStateAction<FormStatus>) => void;
  setValidationErrors: (value: SetStateAction<string[]>) => void;
  setCollectionNameManual: (value: SetStateAction<boolean>) => void;
  setCollectionSymbolManual: (value: SetStateAction<boolean>) => void;
  setImportText: (value: SetStateAction<string>) => void;
  setImportFileName: (value: SetStateAction<string>) => void;
  setImportPreviewCount: (value: SetStateAction<number>) => void;
  setImportHeaders: (value: SetStateAction<string[]>) => void;
  setImportMessage: (value: SetStateAction<string>) => void;
  setImportSubmitting: (value: SetStateAction<boolean>) => void;
  setImportJob: (value: SetStateAction<ImportJobTracker | null>) => void;
  setDragTargetField: (value: SetStateAction<FileUploadField | null>) => void;
  setUploadState: (value: SetStateAction<UploadUiState>) => void;
  setUploadRefs: (value: SetStateAction<UploadRefsState>) => void;
  setMintQuantity: (value: SetStateAction<string>) => void;
  setShowMintSetup: (value: SetStateAction<boolean>) => void;
  setDeployCompletedData: (value: SetStateAction<AssetCreationState["deployCompletedData"]>) => void;
  setSnapshotFinalize: (value: SetStateAction<AssetCreationState["snapshotFinalize"]>) => void;
  setCreateAssetMessage: (value: SetStateAction<string>) => void;
  setIsCreatingMarketplaceEntry: (value: SetStateAction<boolean>) => void;
  setCreatedMarketplaceEntryId: (value: SetStateAction<string | null>) => void;
};

export function useAssetCreationFormState(initialDraftId: string): AssetCreationFormStateApi {
  const [state, dispatch] = useReducer(assetCreationReducer, initialDraftId, createInitialAssetCreationState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (stateRef.current.draftId === initialDraftId) {
      return;
    }

    dispatch(resetState(initialDraftId));
  }, [initialDraftId]);

  const dispatchAndTrack = useCallback((action: AssetCreationAction) => {
    stateRef.current = assetCreationReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  const setForm = useCallback((value: SetStateAction<AssetForm>) => {
    const next = resolveSetStateAction(value, stateRef.current.form);
    dispatchAndTrack(setFormAction(next));
  }, [dispatchAndTrack]);

  const setFormStatus = useCallback((value: SetStateAction<FormStatus>) => {
    const next = resolveSetStateAction(value, stateRef.current.formStatus);
    dispatchAndTrack(setFormStatusAction(next));
  }, [dispatchAndTrack]);

  const setValidationErrors = useCallback((value: SetStateAction<string[]>) => {
    const next = resolveSetStateAction(value, stateRef.current.validationErrors);
    dispatchAndTrack(setValidationErrorsAction(next));
  }, [dispatchAndTrack]);

  const setCollectionNameManual = useCallback((value: SetStateAction<boolean>) => {
    const next = resolveSetStateAction(value, stateRef.current.collectionNameManual);
    dispatchAndTrack(setCollectionNameManualAction(next));
  }, [dispatchAndTrack]);

  const setCollectionSymbolManual = useCallback((value: SetStateAction<boolean>) => {
    const next = resolveSetStateAction(value, stateRef.current.collectionSymbolManual);
    dispatchAndTrack(setCollectionSymbolManualAction(next));
  }, [dispatchAndTrack]);

  const setImportText = useCallback((value: SetStateAction<string>) => {
    const next = resolveSetStateAction(value, stateRef.current.importText);
    dispatchAndTrack(setImportInput({ importText: next }));
  }, [dispatchAndTrack]);

  const setImportFileName = useCallback((value: SetStateAction<string>) => {
    const next = resolveSetStateAction(value, stateRef.current.importFileName);
    dispatchAndTrack(setImportInput({ importFileName: next }));
  }, [dispatchAndTrack]);

  const setImportPreviewCount = useCallback((value: SetStateAction<number>) => {
    const next = resolveSetStateAction(value, stateRef.current.importPreviewCount);
    dispatchAndTrack(setImportInput({ importPreviewCount: next }));
  }, [dispatchAndTrack]);

  const setImportHeaders = useCallback((value: SetStateAction<string[]>) => {
    const next = resolveSetStateAction(value, stateRef.current.importHeaders);
    dispatchAndTrack(setImportInput({ importHeaders: next }));
  }, [dispatchAndTrack]);

  const setImportMessage = useCallback((value: SetStateAction<string>) => {
    const next = resolveSetStateAction(value, stateRef.current.importMessage);
    dispatchAndTrack(setImportInput({ importMessage: next }));
  }, [dispatchAndTrack]);

  const setImportSubmitting = useCallback((value: SetStateAction<boolean>) => {
    const next = resolveSetStateAction(value, stateRef.current.importSubmitting);
    dispatchAndTrack(setImportInput({ importSubmitting: next }));
  }, [dispatchAndTrack]);

  const setImportJob = useCallback((value: SetStateAction<ImportJobTracker | null>) => {
    const next = resolveSetStateAction(value, stateRef.current.importJob);
    dispatchAndTrack(setImportJobAction(next));
  }, [dispatchAndTrack]);

  const setDragTargetField = useCallback((value: SetStateAction<FileUploadField | null>) => {
    const next = resolveSetStateAction(value, stateRef.current.dragTargetField);
    dispatchAndTrack(setDragTargetFieldAction(next));
  }, [dispatchAndTrack]);

  const setUploadState = useCallback((value: SetStateAction<UploadUiState>) => {
    const next = resolveSetStateAction(value, stateRef.current.uploadState);
    dispatchAndTrack(setUploadStateAction(next));
  }, [dispatchAndTrack]);

  const setUploadRefs = useCallback((value: SetStateAction<UploadRefsState>) => {
    const next = resolveSetStateAction(value, stateRef.current.uploadRefs);
    dispatchAndTrack(setUploadRefsAction(next));
  }, [dispatchAndTrack]);

  const setMintQuantity = useCallback((value: SetStateAction<string>) => {
    const next = resolveSetStateAction(value, stateRef.current.mintQuantity);
    dispatchAndTrack(setMintQuantityAction(next));
  }, [dispatchAndTrack]);

  const setShowMintSetup = useCallback((value: SetStateAction<boolean>) => {
    const next = resolveSetStateAction(value, stateRef.current.showMintSetup);
    dispatchAndTrack(setShowMintSetupAction(next));
  }, [dispatchAndTrack]);

  const setDeployCompletedData = useCallback((value: SetStateAction<AssetCreationState["deployCompletedData"]>) => {
    const next = resolveSetStateAction(value, stateRef.current.deployCompletedData);
    dispatchAndTrack(setDeployCompletedDataAction(next));
  }, [dispatchAndTrack]);

  const setSnapshotFinalize = useCallback((value: SetStateAction<AssetCreationState["snapshotFinalize"]>) => {
    const next = resolveSetStateAction(value, stateRef.current.snapshotFinalize);
    dispatchAndTrack(setSnapshotFinalizeAction(next));
  }, [dispatchAndTrack]);

  const setCreateAssetMessage = useCallback((value: SetStateAction<string>) => {
    const next = resolveSetStateAction(value, stateRef.current.createAssetMessage);
    dispatchAndTrack(setCreateAssetFlow({ createAssetMessage: next }));
  }, [dispatchAndTrack]);

  const setIsCreatingMarketplaceEntry = useCallback((value: SetStateAction<boolean>) => {
    const next = resolveSetStateAction(value, stateRef.current.isCreatingMarketplaceEntry);
    dispatchAndTrack(setCreateAssetFlow({ isCreatingMarketplaceEntry: next }));
  }, [dispatchAndTrack]);

  const setCreatedMarketplaceEntryId = useCallback((value: SetStateAction<string | null>) => {
    const next = resolveSetStateAction(value, stateRef.current.createdMarketplaceEntryId);
    dispatchAndTrack(setCreateAssetFlow({ createdMarketplaceEntryId: next }));
  }, [dispatchAndTrack]);

  return {
    ...state,
    setForm,
    setFormStatus,
    setValidationErrors,
    setCollectionNameManual,
    setCollectionSymbolManual,
    setImportText,
    setImportFileName,
    setImportPreviewCount,
    setImportHeaders,
    setImportMessage,
    setImportSubmitting,
    setImportJob,
    setDragTargetField,
    setUploadState,
    setUploadRefs,
    setMintQuantity,
    setShowMintSetup,
    setDeployCompletedData,
    setSnapshotFinalize,
    setCreateAssetMessage,
    setIsCreatingMarketplaceEntry,
    setCreatedMarketplaceEntryId
  };
}
