export const ASSET_UPLOAD_CATEGORIES = [
  "galleryImage",
  "propertyImage",
  "brochureFile",
  "legalDoc",
  "financialDoc"
] as const;

export type AssetUploadCategory = (typeof ASSET_UPLOAD_CATEGORIES)[number];

export type SignedUrlRequest = {
  category: AssetUploadCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
  draftId: string;
};

export type FinalizeUploadRequest = {
  draftId: string;
  etag: string | null;
  sizeBytes: number;
  mimeType: string;
  contentMd5Base64: string;
  previousCdnUrl: string | null;
};

export type SignedUploadContract = {
  uploadId: string;
  actorPubkey: string;
  draftId: string;
  category: AssetUploadCategory;
  originalFileName: string;
  sanitizedFileName: string;
  objectKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
  expiresAt: string;
  createdAt: string;
  finalizedAt: string | null;
  finalFileRefId: string | null;
};

export type UploadedFileRef = {
  fileRefId: string;
  uploadId: string;
  actorPubkey: string;
  draftId: string;
  bucket: string;
  objectKey: string;
  cdnUrl: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
  etag: string | null;
  uploadedAt: string;
  createdAt: string;
};
