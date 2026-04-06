"use client";

import { useCallback, useEffect } from "react";
import type { ChangeEvent } from "react";

import type { ImportJobErrorItem, ImportJobState, ImportJobTracker } from "@/components/admin/asset-creation/types";
import { parseTabularText, parseTextFileToTabularRows } from "@/lib/admin/asset-form";

type SetStateAction<T> = T | ((prev: T) => T);

type ImportTranslations = {
  en: string;
  es: string;
  pt: string;
};

type UseAssetImportJobsArgs = {
  draftId: string;
  importText: string;
  importFileName: string;
  importJob: ImportJobTracker | null;
  setImportSubmitting: (value: SetStateAction<boolean>) => void;
  setImportMessage: (value: SetStateAction<string>) => void;
  setImportJob: (value: SetStateAction<ImportJobTracker | null>) => void;
  setImportHeaders: (value: SetStateAction<string[]>) => void;
  setImportPreviewCount: (value: SetStateAction<number>) => void;
  setImportFileName: (value: SetStateAction<string>) => void;
  t: (copy: ImportTranslations) => string;
  onApplyImportedRow: (row: Record<string, string>) => void;
};

function parseImportJobState(value: unknown): ImportJobState {
  if (
    value === "queued" ||
    value === "processing" ||
    value === "completed" ||
    value === "completed_with_errors" ||
    value === "failed" ||
    value === "delayed"
  ) {
    return value;
  }

  return "queued";
}

function isTerminalImportJobState(state: ImportJobState): boolean {
  return state === "completed" || state === "completed_with_errors" || state === "failed";
}

function toSafeNonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeError = (payload as { error?: { message?: unknown } }).error;
  if (!maybeError || typeof maybeError !== "object") {
    return fallback;
  }

  const message = maybeError.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
}

export function useAssetImportJobs({
  draftId,
  importText,
  importFileName,
  importJob,
  setImportSubmitting,
  setImportMessage,
  setImportJob,
  setImportHeaders,
  setImportPreviewCount,
  setImportFileName,
  t,
  onApplyImportedRow
}: UseAssetImportJobsArgs) {
  const setTrackedImportJobFromStatus = useCallback((
    input: {
      importJobId: string;
      statusUrl: string;
      state: unknown;
      delayed?: unknown;
      totalRows?: unknown;
      processedRows?: unknown;
      failedRows?: unknown;
      warningsCount?: unknown;
      errorReportUrl?: unknown;
    }
  ) => {
    const parsedState = parseImportJobState(input.state);
    const parsedErrorReportUrl = typeof input.errorReportUrl === "string" ? input.errorReportUrl : null;

    setImportJob((prev) => {
      if (prev && prev.importJobId === input.importJobId) {
        return {
          ...prev,
          state: parsedState,
          delayed: Boolean(input.delayed),
          totalRows: toSafeNonNegativeNumber(input.totalRows),
          processedRows: toSafeNonNegativeNumber(input.processedRows),
          failedRows: toSafeNonNegativeNumber(input.failedRows),
          warningsCount: toSafeNonNegativeNumber(input.warningsCount),
          errorReportUrl: parsedErrorReportUrl,
          error: ""
        };
      }

      return {
        importJobId: input.importJobId,
        statusUrl: input.statusUrl,
        state: parsedState,
        delayed: Boolean(input.delayed),
        totalRows: toSafeNonNegativeNumber(input.totalRows),
        processedRows: toSafeNonNegativeNumber(input.processedRows),
        failedRows: toSafeNonNegativeNumber(input.failedRows),
        warningsCount: toSafeNonNegativeNumber(input.warningsCount),
        errorReportUrl: parsedErrorReportUrl,
        errors: [],
        error: ""
      };
    });
  }, [setImportJob]);

  const fetchImportJobErrors = useCallback(async (input: {
    importJobId: string;
    errorReportUrl: string;
  }) => {
    try {
      const separator = input.errorReportUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${input.errorReportUrl}${separator}limit=10&offset=0`, {
        method: "GET",
        cache: "no-store"
      });

      const payload = await response.json().catch(() => null) as {
        errors?: Array<{
          row?: unknown;
          column?: unknown;
          code?: unknown;
          message?: unknown;
        }>;
      } | null;

      if (!response.ok) {
        throw new Error(readApiErrorMessage(payload, "Could not fetch import errors."));
      }

      const mappedErrors: ImportJobErrorItem[] = Array.isArray(payload?.errors)
        ? payload.errors.map((item) => ({
          row: typeof item.row === "number" ? item.row : null,
          column: typeof item.column === "string" ? item.column : null,
          code: typeof item.code === "string" ? item.code : "UNKNOWN",
          message: typeof item.message === "string" ? item.message : "Unknown error"
        }))
        : [];

      setImportJob((prev) => {
        if (!prev || prev.importJobId !== input.importJobId) {
          return prev;
        }

        return {
          ...prev,
          errors: mappedErrors
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not fetch import errors.";
      setImportJob((prev) => {
        if (!prev || prev.importJobId !== input.importJobId) {
          return prev;
        }

        return {
          ...prev,
          error: message
        };
      });
    }
  }, [setImportJob]);

  const pollImportJobStatus = useCallback(async (input: {
    importJobId: string;
    statusUrl: string;
  }) => {
    const response = await fetch(input.statusUrl, {
      method: "GET",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null) as {
      importJobId?: unknown;
      state?: unknown;
      delayed?: unknown;
      totalRows?: unknown;
      processedRows?: unknown;
      failedRows?: unknown;
      warningsCount?: unknown;
      errorReportUrl?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    if (!response.ok) {
      throw new Error(readApiErrorMessage(payload, "Could not fetch import job status."));
    }

    const responseJobId = typeof payload?.importJobId === "string" ? payload.importJobId : input.importJobId;
    setTrackedImportJobFromStatus({
      importJobId: responseJobId,
      statusUrl: input.statusUrl,
      state: payload?.state,
      delayed: payload?.delayed,
      totalRows: payload?.totalRows,
      processedRows: payload?.processedRows,
      failedRows: payload?.failedRows,
      warningsCount: payload?.warningsCount,
      errorReportUrl: payload?.errorReportUrl
    });

    const parsedState = parseImportJobState(payload?.state);
    const parsedErrorReportUrl = typeof payload?.errorReportUrl === "string" ? payload.errorReportUrl : null;

    if ((parsedState === "completed_with_errors" || parsedState === "failed") && parsedErrorReportUrl) {
      await fetchImportJobErrors({
        importJobId: responseJobId,
        errorReportUrl: parsedErrorReportUrl
      });
    }
  }, [fetchImportJobErrors, setTrackedImportJobFromStatus]);

  const enqueueImportJobRequest = useCallback(async (request: {
    csvText?: string;
    file?: File;
    fileName?: string;
    mimeType?: string;
  }) => {
    setImportSubmitting(true);
    setImportMessage(
      t({
        en: "Creating async import job...",
        es: "Creando job de importacion asincrona...",
        pt: "Criando job de importacao assincrona..."
      })
    );

    try {
      let response: Response;

      if (request.file) {
        const formData = new FormData();
        formData.set("file", request.file);
        formData.set("draftId", draftId);
        formData.set("idempotencyKey", `${draftId}:${request.file.name}:${request.file.size}:${request.file.lastModified}`);

        response = await fetch("/api/admin/assets/import-jobs", {
          method: "POST",
          body: formData
        });
      } else {
        response = await fetch("/api/admin/assets/import-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId,
            fileName: request.fileName ?? "pasted-import.csv",
            mimeType: request.mimeType ?? "text/csv",
            csvText: request.csvText ?? ""
          })
        });
      }

      const payload = await response.json().catch(() => null) as {
        importJobId?: unknown;
        statusUrl?: unknown;
        state?: unknown;
        error?: {
          message?: unknown;
        };
      } | null;

      if (!response.ok) {
        throw new Error(readApiErrorMessage(payload, "Could not create import job."));
      }

      const importJobId = typeof payload?.importJobId === "string" ? payload.importJobId : "";
      const statusUrl = typeof payload?.statusUrl === "string" ? payload.statusUrl : "";

      if (!importJobId || !statusUrl) {
        throw new Error("Import job response is missing required fields.");
      }

      setTrackedImportJobFromStatus({
        importJobId,
        statusUrl,
        state: payload?.state
      });

      setImportMessage(
        t({
          en: "Import job created. Validating rows in background...",
          es: "Job de importacion creado. Validando filas en segundo plano...",
          pt: "Job de importacao criado. Validando linhas em segundo plano..."
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create import job.";
      setImportMessage(message);
    } finally {
      setImportSubmitting(false);
    }
  }, [draftId, setImportMessage, setImportSubmitting, setTrackedImportJobFromStatus, t]);

  useEffect(() => {
    if (!importJob?.importJobId || !importJob.statusUrl) {
      return;
    }

    if (isTerminalImportJobState(importJob.state)) {
      return;
    }

    const trackedJobId = importJob.importJobId;
    const trackedStatusUrl = importJob.statusUrl;
    let active = true;

    const tick = async () => {
      if (!active) {
        return;
      }

      try {
        await pollImportJobStatus({
          importJobId: trackedJobId,
          statusUrl: trackedStatusUrl
        });
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : "Could not fetch import job status.";
        setImportJob((prev) => {
          if (!prev || prev.importJobId !== trackedJobId) {
            return prev;
          }

          return {
            ...prev,
            error: message
          };
        });
      }
    };

    void tick();
    const intervalId = setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [importJob?.importJobId, importJob?.statusUrl, importJob?.state, pollImportJobStatus, setImportJob]);

  const previewImportFromText = useCallback(() => {
    const parsed = parseTabularText(importText);
    setImportHeaders(parsed.headers);
    setImportPreviewCount(parsed.rows.length);
    if (parsed.rows.length > 0) {
      onApplyImportedRow(parsed.rows[0] ?? {});
      setImportMessage(t({
        en: "Imported preview row into the form.",
        es: "Se importo la fila de vista previa al formulario.",
        pt: "Linha de pre-visualizacao importada para o formulario."
      }));
    } else {
      setImportMessage(t({
        en: "No valid rows found in pasted content.",
        es: "No se encontraron filas validas en el contenido pegado.",
        pt: "Nenhuma linha valida encontrada no conteudo colado."
      }));
    }
  }, [importText, onApplyImportedRow, setImportHeaders, setImportMessage, setImportPreviewCount, t]);

  const enqueueImportFromText = useCallback(async () => {
    const parsed = parseTabularText(importText);
    setImportHeaders(parsed.headers);
    setImportPreviewCount(parsed.rows.length);

    if (parsed.rows.length === 0) {
      setImportMessage(t({
        en: "No valid rows found in pasted content.",
        es: "No se encontraron filas validas en el contenido pegado.",
        pt: "Nenhuma linha valida encontrada no conteudo colado."
      }));
      return;
    }

    onApplyImportedRow(parsed.rows[0] ?? {});
    await enqueueImportJobRequest({
      csvText: importText,
      fileName: importFileName || "pasted-import.csv",
      mimeType: "text/csv"
    });
  }, [
    importFileName,
    importText,
    onApplyImportedRow,
    setImportHeaders,
    setImportMessage,
    setImportPreviewCount,
    t,
    enqueueImportJobRequest
  ]);

  const onImportFileInput = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportFileName(file.name);
      const text = await file.text();
      const parsed = parseTextFileToTabularRows(file.name, text);
      setImportHeaders(parsed.headers);
      setImportPreviewCount(parsed.rows.length);

      if (parsed.rows.length > 0) {
        onApplyImportedRow(parsed.rows[0] ?? {});
        await enqueueImportJobRequest({ file });
      } else {
        setImportMessage(t({
          en: "File parsed but no rows were detected.",
          es: "Se proceso el archivo pero no se detectaron filas.",
          pt: "Arquivo processado, mas nenhuma linha foi detectada."
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import error.";
      setImportMessage(message);
    } finally {
      event.target.value = "";
    }
  }, [
    enqueueImportJobRequest,
    onApplyImportedRow,
    setImportFileName,
    setImportHeaders,
    setImportMessage,
    setImportPreviewCount,
    t
  ]);

  return {
    previewImportFromText,
    enqueueImportFromText,
    onImportFileInput
  };
}
