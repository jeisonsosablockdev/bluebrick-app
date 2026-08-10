"use client";

import { upload } from "@vercel/blob/client";
import SparkMD5 from "spark-md5";

export type AssetUploadCategory = "galleryImage" | "propertyImage" | "brochureFile" | "legalDoc" | "financialDoc";

export type SeoImageUploadContext = {
  assetName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  internalCode?: string | null;
  assetTypeLabel?: string | null;
  imageRole?: string | null;
};

export type AssetUploadContractResponse = {
  uploadId: string;
  objectKey: string;
  expiresAt: string;
  maxSizeBytes: number;
  clientUploadUrl: string;
  finalizeUrl: string;
};

export type FinalizeResponse = {
  fileRefId: string;
  bucket: string;
  objectKey: string;
  cdnUrl: string;
  uploadedAt: string;
};

export type PromoteEditSessionUploadsResponse = {
  promotedUploads: number;
};

export type CancelEditSessionUploadsResponse = {
  canceledUploads: number;
};

type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
  } | string;
};

function toBase64FromHex(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = parseInt(hex.slice(index, index + 2), 16);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export async function calculateContentMd5Base64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hexDigest = SparkMD5.ArrayBuffer.hash(buffer);
  return toBase64FromHex(hexDigest);
}

function parseApiErrorMessage(payload: unknown, fallbackMessage: string): string {
  const data = payload as ApiErrorShape;
  const errorData = data?.error;

  if (typeof errorData === "string" && errorData.trim()) {
    return errorData.trim();
  }

  if (errorData && typeof errorData === "object") {
    if (typeof errorData.message === "string" && errorData.message.trim()) {
      return errorData.message.trim();
    }

    if (typeof errorData.code === "string" && errorData.code.trim()) {
      return errorData.code.trim();
    }
  }

  return fallbackMessage;
}

async function safeJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function uploadAssetFileViaClientBlob(input: {
  file: File;
  category: AssetUploadCategory;
  draftId: string;
  editSessionId?: string | null;
  seoImageContext?: SeoImageUploadContext | null;
  previousCdnUrl?: string | null;
}): Promise<FinalizeResponse> {
  const contentMd5Base64 = await calculateContentMd5Base64(input.file);

  const signedResponse = await fetch("/api/admin/assets/uploads/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      category: input.category,
      fileName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      contentMd5Base64,
      draftId: input.draftId,
      editSessionId: input.editSessionId?.trim() || null,
      seoImageContext: input.seoImageContext ?? null
    })
  });

  const signedPayload = await safeJson(signedResponse);
  if (!signedResponse.ok) {
    throw new Error(parseApiErrorMessage(signedPayload, "Could not get a signed upload URL."));
  }

  const signed = signedPayload as AssetUploadContractResponse;

  const blob = await upload(signed.objectKey, input.file, {
    access: "public",
    handleUploadUrl: signed.clientUploadUrl,
    clientPayload: JSON.stringify({ uploadId: signed.uploadId }),
    contentType: input.file.type,
    multipart: input.file.size > 8 * 1024 * 1024
  });

  const finalizeResponse = await fetch(signed.finalizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      draftId: input.draftId,
      editSessionId: input.editSessionId?.trim() || null,
      etag: blob.etag,
      sizeBytes: input.file.size,
      mimeType: input.file.type,
      contentMd5Base64,
      previousCdnUrl: input.previousCdnUrl?.trim() || null
    })
  });

  const finalizePayload = await safeJson(finalizeResponse);
  if (!finalizeResponse.ok) {
    throw new Error(parseApiErrorMessage(finalizePayload, "Could not finalize uploaded file."));
  }

  return finalizePayload as FinalizeResponse;
}

export async function promoteAssetUploadEditSession(input: {
  draftId: string;
  editSessionId: string;
}): Promise<PromoteEditSessionUploadsResponse> {
  const response = await fetch("/api/admin/assets/uploads/edit-session/promote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      draftId: input.draftId,
      editSessionId: input.editSessionId
    })
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(parseApiErrorMessage(payload, "Could not promote uploaded files."));
  }

  return payload as PromoteEditSessionUploadsResponse;
}

export async function cancelAssetUploadEditSession(input: {
  draftId: string;
  editSessionId: string;
  keepalive?: boolean;
}): Promise<CancelEditSessionUploadsResponse> {
  const response = await fetch("/api/admin/assets/uploads/edit-session/cancel", {
    method: "POST",
    keepalive: input.keepalive,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      draftId: input.draftId,
      editSessionId: input.editSessionId
    })
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(parseApiErrorMessage(payload, "Could not cancel uploaded files."));
  }

  return payload as CancelEditSessionUploadsResponse;
}
