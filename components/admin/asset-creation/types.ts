import type {
  DeployCompletedPayload,
  SnapshotFinalizeResponse
} from "@/components/admin/core-candy-machine-panel";

export type AssetType = "building_new" | "rental_property" | "land_lot" | "";
export type FormStatus = "draft" | "saving" | "saved" | "validation-error";
export type TypeFormState = "incomplete" | "valid" | "invalid";
export type FileUploadField = "coverImage" | "galleryImages" | "brochureFile" | "legalDocs" | "financialDocs" | "propertyImages";

export type UploadFieldUiState = {
  uploading: boolean;
  message: string;
  error: string;
};

export type ImportJobState =
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "delayed";

export type ImportJobErrorItem = {
  row: number | null;
  column: string | null;
  code: string;
  message: string;
};

export type ImportJobTracker = {
  importJobId: string;
  statusUrl: string;
  state: ImportJobState;
  delayed: boolean;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  warningsCount: number;
  errorReportUrl: string | null;
  errors: ImportJobErrorItem[];
  error: string;
};

export type AssetForm = {
  assetType: AssetType;
  assetName: string;
  slug: string;
  internalCode: string;
  country: string;
  state: string;
  city: string;
  address: string;
  geoLat: string;
  geoLng: string;
  shortDescription: string;
  longDescription: string;
  investmentThesis: string;
  riskNotes: string;
  coverImage: string;
  galleryImages: string[];
  videoUrl: string;
  brochureFile: string;
  legalDocs: string[];
  financialDocs: string[];
  propertyImages: string[];
  collectionName: string;
  collectionSymbol: string;
  purchasePriceUsd: string;
  afterRepairValueUsd: string;
  rehabBudgetUsd: string;
  closingCostsUsd: string;
  holdingCostsUsd: string;
  sellingCostsUsd: string;
  totalProjectCostUsd: string;
  structuringFeeUsd: string;
  grossProfitProjectedUsd: string;
  managementFeeUsd: string;
  brokerFeeUsd: string;
  netInvestorProfitUsd: string;
  projectedNetRoiPct: string;
  buildingProjectStage: string;
  buildingDeveloperName: string;
  buildingEstimatedDeliveryDate: string;
  buildingConstructionStartDate: string;
  buildingTotalUnits: string;
  buildingFundingGoal: string;
  buildingNftCost: string;
  buildingExpectedAnnualReturn: string;
  buildingExitStrategy: string;
  buildingProjectDurationMonths: string;
  buildingLicensesStatus: string;
  buildingFiduciaryStructure: string;
  buildingSalesProgressPercent: string;
  rentalMonthlyRentEstimate: string;
  rentalAnnualGrossIncome: string;
  rentalOccupancyRate: string;
  rentalLeaseStartDate: string;
  rentalLeaseEndDate: string;
  rentalTenantType: string;
  rentalPropertyManager: string;
  rentalHistoricalYield: string;
  rentalMaintenanceReserve: string;
  rentalCurrentTenant: string;
  rentalContractStatus: string;
  rentalPaymentFrequency: string;
  landCadastralNumber: string;
  landAreaM2: string;
  landUse: string;
  landZoningClassification: string;
  landAppreciationHorizonMonths: string;
  landTargetExitValue: string;
  landEntryPrice: string;
  landExitStrategy: string;
  landUrbanDevelopmentPotential: string;
  landRoadAccess: string;
  landUtilitiesAccess: string;
  landRegulatoryStatus: string;
};

export type UploadRefsState = Record<FileUploadField, string[]>;
export type UploadUiState = Record<FileUploadField, UploadFieldUiState>;

export type AssetCreationState = {
  draftId: string;
  form: AssetForm;
  formStatus: FormStatus;
  validationErrors: string[];
  collectionNameManual: boolean;
  collectionSymbolManual: boolean;
  importText: string;
  importFileName: string;
  importFingerprint: string;
  importPreviewCount: number;
  importHeaders: string[];
  importMessage: string;
  importSubmitting: boolean;
  importJob: ImportJobTracker | null;
  dragTargetField: FileUploadField | null;
  uploadState: UploadUiState;
  uploadRefs: UploadRefsState;
  mintQuantity: string;
  showMintSetup: boolean;
  deployCompletedData: DeployCompletedPayload | null;
  snapshotFinalize: SnapshotFinalizeResponse | null;
  createAssetMessage: string;
  isCreatingMarketplaceEntry: boolean;
  createdMarketplaceEntryId: string | null;
};

export const initialAssetForm: AssetForm = {
  assetType: "",
  assetName: "",
  slug: "",
  internalCode: "",
  country: "",
  state: "",
  city: "",
  address: "",
  geoLat: "",
  geoLng: "",
  shortDescription: "",
  longDescription: "",
  investmentThesis: "",
  riskNotes: "",
  coverImage: "",
  galleryImages: [],
  videoUrl: "",
  brochureFile: "",
  legalDocs: [],
  financialDocs: [],
  propertyImages: [],
  collectionName: "",
  collectionSymbol: "",
  purchasePriceUsd: "",
  afterRepairValueUsd: "",
  rehabBudgetUsd: "",
  closingCostsUsd: "",
  holdingCostsUsd: "",
  sellingCostsUsd: "",
  totalProjectCostUsd: "",
  structuringFeeUsd: "",
  grossProfitProjectedUsd: "",
  managementFeeUsd: "",
  brokerFeeUsd: "",
  netInvestorProfitUsd: "",
  projectedNetRoiPct: "",
  buildingProjectStage: "",
  buildingDeveloperName: "",
  buildingEstimatedDeliveryDate: "",
  buildingConstructionStartDate: "",
  buildingTotalUnits: "",
  buildingFundingGoal: "",
  buildingNftCost: "",
  buildingExpectedAnnualReturn: "",
  buildingExitStrategy: "",
  buildingProjectDurationMonths: "",
  buildingLicensesStatus: "",
  buildingFiduciaryStructure: "",
  buildingSalesProgressPercent: "",
  rentalMonthlyRentEstimate: "",
  rentalAnnualGrossIncome: "",
  rentalOccupancyRate: "",
  rentalLeaseStartDate: "",
  rentalLeaseEndDate: "",
  rentalTenantType: "",
  rentalPropertyManager: "",
  rentalHistoricalYield: "",
  rentalMaintenanceReserve: "",
  rentalCurrentTenant: "",
  rentalContractStatus: "",
  rentalPaymentFrequency: "",
  landCadastralNumber: "",
  landAreaM2: "",
  landUse: "",
  landZoningClassification: "",
  landAppreciationHorizonMonths: "",
  landTargetExitValue: "",
  landEntryPrice: "",
  landExitStrategy: "",
  landUrbanDevelopmentPotential: "",
  landRoadAccess: "",
  landUtilitiesAccess: "",
  landRegulatoryStatus: ""
};

export const initialUploadUiState: UploadUiState = {
  coverImage: { uploading: false, message: "", error: "" },
  galleryImages: { uploading: false, message: "", error: "" },
  brochureFile: { uploading: false, message: "", error: "" },
  legalDocs: { uploading: false, message: "", error: "" },
  financialDocs: { uploading: false, message: "", error: "" },
  propertyImages: { uploading: false, message: "", error: "" }
};

export const initialUploadRefsState: UploadRefsState = {
  coverImage: [],
  galleryImages: [],
  brochureFile: [],
  legalDocs: [],
  financialDocs: [],
  propertyImages: []
};

export function createInitialAssetCreationState(draftId: string): AssetCreationState {
  return {
    draftId,
    form: { ...initialAssetForm },
    formStatus: "draft",
    validationErrors: [],
    collectionNameManual: false,
    collectionSymbolManual: false,
    importText: "",
    importFileName: "",
    importFingerprint: "",
    importPreviewCount: 0,
    importHeaders: [],
    importMessage: "",
    importSubmitting: false,
    importJob: null,
    dragTargetField: null,
    uploadState: {
      coverImage: { ...initialUploadUiState.coverImage },
      galleryImages: { ...initialUploadUiState.galleryImages },
      brochureFile: { ...initialUploadUiState.brochureFile },
      legalDocs: { ...initialUploadUiState.legalDocs },
      financialDocs: { ...initialUploadUiState.financialDocs },
      propertyImages: { ...initialUploadUiState.propertyImages }
    },
    uploadRefs: {
      coverImage: [],
      galleryImages: [],
      brochureFile: [],
      legalDocs: [],
      financialDocs: [],
      propertyImages: []
    },
    mintQuantity: "1",
    showMintSetup: false,
    deployCompletedData: null,
    snapshotFinalize: null,
    createAssetMessage: "",
    isCreatingMarketplaceEntry: false,
    createdMarketplaceEntryId: null
  };
}
