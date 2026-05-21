import type {
  AssetCreationState,
  AssetForm,
  FileUploadField,
  FormStatus,
  ImportJobTracker,
  UploadRefsState,
  UploadFieldUiState
} from "@/components/admin/asset-creation/types";

type SetFormFieldAction<K extends keyof AssetForm = keyof AssetForm> = {
  type: "assetCreation/setFormField";
  payload: {
    field: K;
    value: AssetForm[K];
  };
};

type SetFormAction = {
  type: "assetCreation/setForm";
  payload: AssetForm;
};

type PatchFormAction = {
  type: "assetCreation/patchForm";
  payload: Partial<AssetForm>;
};

type SetFormStatusAction = {
  type: "assetCreation/setFormStatus";
  payload: FormStatus;
};

type SetValidationErrorsAction = {
  type: "assetCreation/setValidationErrors";
  payload: string[];
};

type SetCollectionNameManualAction = {
  type: "assetCreation/setCollectionNameManual";
  payload: boolean;
};

type SetCollectionSymbolManualAction = {
  type: "assetCreation/setCollectionSymbolManual";
  payload: boolean;
};

type SetImportInputAction = {
  type: "assetCreation/setImportInput";
  payload: {
    importText?: string;
    importFileName?: string;
    importFingerprint?: string;
    importPreviewCount?: number;
    importHeaders?: string[];
    importMessage?: string;
    importSubmitting?: boolean;
  };
};

type SetImportJobAction = {
  type: "assetCreation/setImportJob";
  payload: ImportJobTracker | null;
};

type SetDragTargetFieldAction = {
  type: "assetCreation/setDragTargetField";
  payload: FileUploadField | null;
};

type PatchUploadFieldStateAction = {
  type: "assetCreation/patchUploadFieldState";
  payload: {
    field: FileUploadField;
    patch: Partial<UploadFieldUiState>;
  };
};

type SetUploadStateAction = {
  type: "assetCreation/setUploadState";
  payload: AssetCreationState["uploadState"];
};

type SetUploadFieldRefsAction = {
  type: "assetCreation/setUploadFieldRefs";
  payload: {
    field: FileUploadField;
    refs: string[];
  };
};

type SetUploadRefsAction = {
  type: "assetCreation/setUploadRefs";
  payload: UploadRefsState;
};

type SetMintQuantityAction = {
  type: "assetCreation/setMintQuantity";
  payload: string;
};

type SetShowMintSetupAction = {
  type: "assetCreation/setShowMintSetup";
  payload: boolean;
};

type SetDeployCompletedDataAction = {
  type: "assetCreation/setDeployCompletedData";
  payload: AssetCreationState["deployCompletedData"];
};

type SetSnapshotFinalizeAction = {
  type: "assetCreation/setSnapshotFinalize";
  payload: AssetCreationState["snapshotFinalize"];
};

type SetCreateAssetFlowAction = {
  type: "assetCreation/setCreateAssetFlow";
  payload: {
    createAssetMessage?: string;
    isCreatingMarketplaceEntry?: boolean;
    createdMarketplaceEntryId?: string | null;
  };
};

type ResetStateAction = {
  type: "assetCreation/resetState";
  payload: {
    draftId: string;
  };
};

export type AssetCreationAction =
  | SetFormFieldAction
  | SetFormAction
  | PatchFormAction
  | SetFormStatusAction
  | SetValidationErrorsAction
  | SetCollectionNameManualAction
  | SetCollectionSymbolManualAction
  | SetImportInputAction
  | SetImportJobAction
  | SetDragTargetFieldAction
  | PatchUploadFieldStateAction
  | SetUploadStateAction
  | SetUploadFieldRefsAction
  | SetUploadRefsAction
  | SetMintQuantityAction
  | SetShowMintSetupAction
  | SetDeployCompletedDataAction
  | SetSnapshotFinalizeAction
  | SetCreateAssetFlowAction
  | ResetStateAction;

export function setFormField<K extends keyof AssetForm>(
  field: K,
  value: AssetForm[K]
): SetFormFieldAction<K> {
  return {
    type: "assetCreation/setFormField",
    payload: { field, value }
  };
}

export function setForm(payload: AssetForm): SetFormAction {
  return {
    type: "assetCreation/setForm",
    payload
  };
}

export function patchForm(payload: Partial<AssetForm>): PatchFormAction {
  return {
    type: "assetCreation/patchForm",
    payload
  };
}

export function setFormStatus(payload: FormStatus): SetFormStatusAction {
  return {
    type: "assetCreation/setFormStatus",
    payload
  };
}

export function setValidationErrors(payload: string[]): SetValidationErrorsAction {
  return {
    type: "assetCreation/setValidationErrors",
    payload
  };
}

export function setCollectionNameManual(payload: boolean): SetCollectionNameManualAction {
  return {
    type: "assetCreation/setCollectionNameManual",
    payload
  };
}

export function setCollectionSymbolManual(payload: boolean): SetCollectionSymbolManualAction {
  return {
    type: "assetCreation/setCollectionSymbolManual",
    payload
  };
}

export function setImportInput(payload: SetImportInputAction["payload"]): SetImportInputAction {
  return {
    type: "assetCreation/setImportInput",
    payload
  };
}

export function setImportJob(payload: ImportJobTracker | null): SetImportJobAction {
  return {
    type: "assetCreation/setImportJob",
    payload
  };
}

export function setDragTargetField(payload: FileUploadField | null): SetDragTargetFieldAction {
  return {
    type: "assetCreation/setDragTargetField",
    payload
  };
}

export function patchUploadFieldState(
  field: FileUploadField,
  patch: Partial<UploadFieldUiState>
): PatchUploadFieldStateAction {
  return {
    type: "assetCreation/patchUploadFieldState",
    payload: { field, patch }
  };
}

export function setUploadState(payload: AssetCreationState["uploadState"]): SetUploadStateAction {
  return {
    type: "assetCreation/setUploadState",
    payload
  };
}

export function setUploadFieldRefs(field: FileUploadField, refs: string[]): SetUploadFieldRefsAction {
  return {
    type: "assetCreation/setUploadFieldRefs",
    payload: { field, refs }
  };
}

export function setUploadRefs(payload: UploadRefsState): SetUploadRefsAction {
  return {
    type: "assetCreation/setUploadRefs",
    payload
  };
}

export function setMintQuantity(payload: string): SetMintQuantityAction {
  return {
    type: "assetCreation/setMintQuantity",
    payload
  };
}

export function setShowMintSetup(payload: boolean): SetShowMintSetupAction {
  return {
    type: "assetCreation/setShowMintSetup",
    payload
  };
}

export function setDeployCompletedData(payload: AssetCreationState["deployCompletedData"]): SetDeployCompletedDataAction {
  return {
    type: "assetCreation/setDeployCompletedData",
    payload
  };
}

export function setSnapshotFinalize(payload: AssetCreationState["snapshotFinalize"]): SetSnapshotFinalizeAction {
  return {
    type: "assetCreation/setSnapshotFinalize",
    payload
  };
}

export function setCreateAssetFlow(payload: SetCreateAssetFlowAction["payload"]): SetCreateAssetFlowAction {
  return {
    type: "assetCreation/setCreateAssetFlow",
    payload
  };
}

export function resetState(draftId: string): ResetStateAction {
  return {
    type: "assetCreation/resetState",
    payload: { draftId }
  };
}
