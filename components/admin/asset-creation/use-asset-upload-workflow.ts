"use client";

import { useCallback } from "react";
import type { ChangeEvent, DragEvent } from "react";

import type { AssetForm, FileUploadField, UploadRefsState, UploadUiState } from "@/components/admin/asset-creation/types";
import {
  type AssetUploadCategory,
  type FinalizeResponse,
  type SeoImageUploadContext,
  uploadAssetFileViaSignedUrl
} from "@/lib/admin/asset-upload-client";

type SetStateAction<T> = T | ((prev: T) => T);

type UploadTranslations = {
  en: string;
  es: string;
  pt: string;
};

type UseAssetUploadWorkflowArgs = {
  draftId: string;
  editSessionId: string;
  form: AssetForm;
  dragTargetField: FileUploadField | null;
  setForm: (value: SetStateAction<AssetForm>) => void;
  setUploadState: (value: SetStateAction<UploadUiState>) => void;
  setUploadRefs: (value: SetStateAction<UploadRefsState>) => void;
  setDragTargetField: (value: SetStateAction<FileUploadField | null>) => void;
  t: (copy: UploadTranslations) => string;
};

function fieldToUploadCategory(field: FileUploadField): AssetUploadCategory {
  if (field === "propertyImages") {
    return "propertyImage";
  }

  if (field === "brochureFile") {
    return "brochureFile";
  }

  if (field === "legalDocs") {
    return "legalDoc";
  }

  if (field === "financialDocs") {
    return "financialDoc";
  }

  return "galleryImage";
}

function fieldToSeoImageRole(field: FileUploadField): string | null {
  if (field === "coverImage") {
    return "cover";
  }

  if (field === "galleryImages") {
    return "gallery";
  }

  if (field === "propertyImages") {
    return "property";
  }

  return null;
}

function assetTypeToSeoLabel(assetType: AssetForm["assetType"]): string | null {
  if (assetType === "building_new") {
    return "fix flip";
  }

  if (assetType === "rental_property") {
    return "fix hold";
  }

  if (assetType === "land_lot") {
    return "real estate dev";
  }

  return null;
}

function buildSeoImageContext(form: AssetForm, field: FileUploadField): SeoImageUploadContext | null {
  const imageRole = fieldToSeoImageRole(field);
  if (!imageRole) {
    return null;
  }

  return {
    assetName: form.assetName,
    city: form.city,
    state: form.state,
    country: form.country,
    internalCode: form.internalCode,
    assetTypeLabel: assetTypeToSeoLabel(form.assetType),
    imageRole
  };
}

function updateListField(current: string[], fileNames: string[]): string[] {
  const merged = [...fileNames, ...current];
  const unique = Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
  return unique.slice(0, 20);
}

export function useAssetUploadWorkflow({
  draftId,
  editSessionId,
  form,
  dragTargetField,
  setForm,
  setUploadState,
  setUploadRefs,
  setDragTargetField,
  t
}: UseAssetUploadWorkflowArgs) {
  const patchUploadState = useCallback((field: FileUploadField, patch: Partial<UploadUiState[FileUploadField]>) => {
    setUploadState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...patch
      }
    }));
  }, [setUploadState]);

  const applySuccessfulUploads = useCallback((field: FileUploadField, uploaded: FinalizeResponse[]) => {
    if (uploaded.length === 0) {
      return;
    }

    const cdnUrls = uploaded.map((item) => item.cdnUrl);
    const fileRefIds = uploaded.map((item) => item.fileRefId);

    setUploadRefs((prev) => ({
      ...prev,
      [field]: updateListField(prev[field], fileRefIds)
    }));

    if (field === "coverImage" || field === "brochureFile") {
      const firstUrl = cdnUrls[0];
      if (!firstUrl) {
        return;
      }

      setForm((prev) => ({ ...prev, [field]: firstUrl }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: updateListField(prev[field], cdnUrls) }));
  }, [setForm, setUploadRefs]);

  const applyFilesToField = useCallback(async (field: FileUploadField, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const filesToUpload = field === "coverImage" ? files.slice(-1) : files;

    patchUploadState(field, {
      uploading: true,
      error: "",
      message: t({ en: "Uploading...", es: "Subiendo...", pt: "Enviando..." })
    });

    const uploaded: FinalizeResponse[] = [];
    const failed: string[] = [];
    const category = fieldToUploadCategory(field);
    const seoImageContext = buildSeoImageContext(form, field);
    const previousSingleFieldCdnUrl = (field === "coverImage" || field === "brochureFile")
      ? form[field].trim()
      : "";

    for (let index = 0; index < filesToUpload.length; index += 1) {
      const file = filesToUpload[index];
      if (!file) {
        continue;
      }

      patchUploadState(field, {
        message: t({
          en: `Uploading ${index + 1}/${filesToUpload.length}: ${file.name}`,
          es: `Subiendo ${index + 1}/${filesToUpload.length}: ${file.name}`,
          pt: `Enviando ${index + 1}/${filesToUpload.length}: ${file.name}`
        })
      });

      try {
        const result = await uploadAssetFileViaSignedUrl({
          file,
          category,
          draftId,
          editSessionId,
          seoImageContext,
          previousCdnUrl: previousSingleFieldCdnUrl || null
        });
        uploaded.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error.";
        failed.push(`${file.name}: ${message}`);
      }
    }

    applySuccessfulUploads(field, uploaded);

    patchUploadState(field, {
      uploading: false,
      message: uploaded.length > 0
        ? t({
          en: `${uploaded.length} file(s) uploaded.`,
          es: `${uploaded.length} archivo(s) subidos.`,
          pt: `${uploaded.length} arquivo(s) enviados.`
        })
        : "",
      error: failed.join(" | ")
    });
  }, [applySuccessfulUploads, draftId, editSessionId, form, patchUploadState, t]);

  const onFileInput = useCallback((field: FileUploadField) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      void applyFilesToField(field, Array.from(files));
      event.target.value = "";
    };
  }, [applyFilesToField]);

  const onFileDragOver = useCallback((field: FileUploadField) => {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (dragTargetField !== field) {
        setDragTargetField(field);
      }
    };
  }, [dragTargetField, setDragTargetField]);

  const onFileDragLeave = useCallback((field: FileUploadField) => {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }
      if (dragTargetField === field) {
        setDragTargetField(null);
      }
    };
  }, [dragTargetField, setDragTargetField]);

  const onFileDrop = useCallback((field: FileUploadField) => {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragTargetField(null);
      const files = Array.from(event.dataTransfer.files ?? []);
      void applyFilesToField(field, files);
    };
  }, [applyFilesToField, setDragTargetField]);

  const uploadFieldValue = useCallback((field: FileUploadField): string => {
    if (field === "coverImage") return form.coverImage;
    if (field === "brochureFile") return form.brochureFile;
    if (field === "galleryImages") return form.galleryImages.join(", ");
    if (field === "legalDocs") return form.legalDocs.join(", ");
    if (field === "financialDocs") return form.financialDocs.join(", ");
    return form.propertyImages.join(", ");
  }, [form]);

  return {
    onFileInput,
    onFileDragOver,
    onFileDragLeave,
    onFileDrop,
    uploadFieldValue
  };
}
