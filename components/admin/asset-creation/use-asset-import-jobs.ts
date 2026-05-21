"use client";

import { useCallback } from "react";
import type { ChangeEvent } from "react";

import { parseTabularText, parseTextFileToTabularRows } from "@/lib/admin/asset-form";

type SetStateAction<T> = T | ((prev: T) => T);

type ImportTranslations = {
  en: string;
  es: string;
  pt: string;
};

export type ParsedImportCandidate = {
  fileName: string;
  fingerprint: string;
  headers: string[];
  rows: Array<Record<string, string>>;
  text: string;
};

type UseAssetImportJobsArgs = {
  setImportMessage: (value: SetStateAction<string>) => void;
  setImportHeaders: (value: SetStateAction<string[]>) => void;
  setImportPreviewCount: (value: SetStateAction<number>) => void;
  setImportFileName: (value: SetStateAction<string>) => void;
  setImportFingerprint: (value: SetStateAction<string>) => void;
  setImportText: (value: SetStateAction<string>) => void;
  t: (copy: ImportTranslations) => string;
  onApplyImportedRow: (row: Record<string, string>) => void;
};

function buildNoRowsMessage(t: (copy: ImportTranslations) => string): string {
  return t({
    en: "No valid rows were detected in the imported content.",
    es: "No se detectaron filas validas en el contenido importado.",
    pt: "Nenhuma linha valida foi detectada no conteudo importado."
  });
}

async function fetchPdfImportPreview(file: File): Promise<ParsedImportCandidate> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/assets/import-preview", {
    method: "POST",
    body: formData
  });

  const payload = await response.json().catch(() => null) as {
    data?: ParsedImportCandidate;
    error?: { message?: string };
  } | null;

  if (!response.ok || !payload?.data) {
    const message = payload?.error?.message?.trim() || "Could not preview the PDF import.";
    throw new Error(message);
  }

  return payload.data;
}

export function useAssetImportJobs({
  setImportMessage,
  setImportHeaders,
  setImportPreviewCount,
  setImportFileName,
  setImportFingerprint,
  setImportText,
  t,
  onApplyImportedRow
}: UseAssetImportJobsArgs) {
  const buildImportCandidateFromText = useCallback((input: {
    text: string;
    fileName?: string;
  }): ParsedImportCandidate | null => {
    const parsed = parseTabularText(input.text);
    setImportHeaders(parsed.headers);
    setImportPreviewCount(parsed.rows.length);

    if (parsed.rows.length === 0) {
      setImportMessage(buildNoRowsMessage(t));
      return null;
    }

    return {
      fileName: input.fileName?.trim() || "pasted-import.tsv",
      fingerprint: `text:${input.fileName?.trim() || "pasted-import.tsv"}:${input.text}`,
      headers: parsed.headers,
      rows: parsed.rows,
      text: input.text
    };
  }, [setImportHeaders, setImportMessage, setImportPreviewCount, t]);

  const applyImportCandidate = useCallback((candidate: ParsedImportCandidate) => {
    setImportFileName(candidate.fileName);
    setImportFingerprint(candidate.fingerprint);
    setImportText(candidate.text);
    setImportHeaders(candidate.headers);
    setImportPreviewCount(candidate.rows.length);
    onApplyImportedRow(candidate.rows[0] ?? {});
    setImportMessage(t({
      en: "Import preview applied automatically. Review and adjust the form below.",
      es: "La vista previa de la importacion se aplico automaticamente. Revisa y ajusta el formulario abajo.",
      pt: "A pre-visualizacao da importacao foi aplicada automaticamente. Revise e ajuste o formulario abaixo."
    }));
  }, [
    onApplyImportedRow,
    setImportFileName,
    setImportFingerprint,
    setImportHeaders,
    setImportMessage,
    setImportPreviewCount,
    setImportText,
    t
  ]);

  const onImportFileInput = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<ParsedImportCandidate | null> => {
    const file = event.target.files?.[0];
    if (!file) {
      return null;
    }

    try {
      const extension = file.name.toLowerCase().split(".").pop();

      if (extension === "pdf") {
        const candidate = await fetchPdfImportPreview(file);
        setImportHeaders(candidate.headers);
        setImportPreviewCount(candidate.rows.length);

        if (candidate.rows.length === 0) {
          setImportMessage(t({
            en: "The PDF was read, but no supported deal fields were detected.",
            es: "Se leyo el PDF, pero no se detectaron campos compatibles del deal.",
            pt: "O PDF foi lido, mas nenhum campo compativel do deal foi detectado."
          }));
          return null;
        }

        return candidate;
      }

      const text = await file.text();
      const parsed = parseTextFileToTabularRows(file.name, text);
      setImportHeaders(parsed.headers);
      setImportPreviewCount(parsed.rows.length);

      if (parsed.rows.length === 0) {
        setImportMessage(t({
          en: "File parsed but no rows were detected.",
          es: "Se proceso el archivo pero no se detectaron filas.",
          pt: "Arquivo processado, mas nenhuma linha foi detectada."
        }));
        return null;
      }

      return {
        fileName: file.name,
        fingerprint: `text:${file.name}:${text}`,
        headers: parsed.headers,
        rows: parsed.rows,
        text
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import error.";
      setImportMessage(message);
      return null;
    } finally {
      event.target.value = "";
    }
  }, [setImportHeaders, setImportMessage, setImportPreviewCount, t]);

  return {
    buildImportCandidateFromText,
    applyImportCandidate,
    onImportFileInput
  };
}
