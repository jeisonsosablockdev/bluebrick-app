"use client";

import SparkMD5 from "spark-md5";

export type AssetUploadCategory = "galleryImage" | "propertyImage" | "brochureFile" | "legalDoc" | "financialDoc";

export type SignedUrlResponse = {
  uploadId: string;
  uploadUrl: string;
  method: "PUT";
  requiredHeaders: {
    "Content-Type": string;
    "Content-Length": string;
    "Content-MD5": string;
  };
  objectKey: string;
  expiresAt: string;
  maxSizeBytes: number;
  finalizeUrl: string;
};

export type FinalizeResponse = {
  fileRefId: string;
  bucket: string;
  objectKey: string;
  cdnUrl: string;
  uploadedAt: string;
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

function buildUploadHeaders(
  requiredHeaders: SignedUrlResponse["requiredHeaders"]
): Record<string, string> {
  // Browsers do not allow setting Content-Length manually.
  return {
    "Content-Type": requiredHeaders["Content-Type"],
    "Content-MD5": requiredHeaders["Content-MD5"]
  };
}

export async function uploadAssetFileViaSignedUrl(input: {
  file: File;
  category: AssetUploadCategory;
  draftId: string;
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
      draftId: input.draftId
    })
  });

  const signedPayload = await safeJson(signedResponse);
  if (!signedResponse.ok) {
    throw new Error(parseApiErrorMessage(signedPayload, "Could not get a signed upload URL."));
  }

  const signed = signedPayload as SignedUrlResponse;

  const putResponse = await fetch(signed.uploadUrl, {
    method: signed.method,
    headers: buildUploadHeaders(signed.requiredHeaders),
    body: input.file
  });

  if (!putResponse.ok) {
    throw new Error(`Storage upload failed (${putResponse.status}).`);
  }

  const finalizeResponse = await fetch(signed.finalizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      draftId: input.draftId,
      etag: putResponse.headers.get("etag"),
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
