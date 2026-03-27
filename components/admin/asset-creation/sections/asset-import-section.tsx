import type { ChangeEvent, ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { ImportJobTracker } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetImportSectionProps = {
  t: SectionT;
  importFileName: string;
  importText: string;
  importPreviewCount: number;
  importHeaders: string[];
  importMessage: string;
  importSubmitting: boolean;
  importJob: ImportJobTracker | null;
  setImportText: (value: SetStateAction<string>) => void;
  previewImportFromText: () => void;
  enqueueImportFromText: () => Promise<void>;
  onImportFileInput: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function AssetImportSection({
  t,
  importFileName,
  importText,
  importPreviewCount,
  importHeaders,
  importMessage,
  importSubmitting,
  importJob,
  setImportText,
  previewImportFromText,
  enqueueImportFromText,
  onImportFileInput
}: AssetImportSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Quick import (CSV or paste from Excel)", es: "Importacion rapida (CSV o pegado desde Excel)", pt: "Importacao rapida (CSV ou colar do Excel)" })}</p>
      <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
        <p>{t({ en: "Import file (.csv, .txt, .tsv)", es: "Importar archivo (.csv, .txt, .tsv)", pt: "Importar arquivo (.csv, .txt, .tsv)" })}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input id="quick-import-file" className="sr-only" type="file" accept=".csv,.txt,.tsv" onChange={(event) => { void onImportFileInput(event); }} />
          <label
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            htmlFor="quick-import-file"
          >
            {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
          </label>
          <p className="text-xs text-white/60">
            {importFileName || t({ en: "No file selected", es: "Sin archivo seleccionado", pt: "Nenhum arquivo selecionado" })}
          </p>
        </div>
      </div>
      <textarea
        className="min-h-24 resize-none appearance-none rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white"
        placeholder={t({
          en: "Paste cells copied from Excel (tabular content with header row).",
          es: "Pega celdas copiadas desde Excel (contenido tabular con fila de encabezados).",
          pt: "Cole celulas copiadas do Excel (conteudo tabular com linha de cabecalho)."
        })}
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button className="min-h-11" disabled={importSubmitting} variant="outline" onClick={previewImportFromText}>
          {t({ en: "Preview and apply first row", es: "Previsualizar y aplicar primera fila", pt: "Pre-visualizar e aplicar primeira linha" })}
        </Button>
        <Button className="min-h-11" disabled={importSubmitting} onClick={() => { void enqueueImportFromText(); }}>
          {importSubmitting
            ? t({ en: "Queueing import...", es: "Encolando importacion...", pt: "Enfileirando importacao..." })
            : t({ en: "Queue async import", es: "Encolar importacion async", pt: "Enfileirar importacao async" })}
        </Button>
        <p className="text-xs text-white/60">
          {t({ en: "Columns detected", es: "Columnas detectadas", pt: "Colunas detectadas" })}: {importHeaders.length}
        </p>
        <p className="text-xs text-white/60">
          {t({ en: "Rows detected", es: "Filas detectadas", pt: "Linhas detectadas" })}: {importPreviewCount}
        </p>
      </div>
      {importMessage && <p className="text-xs text-cyan-100">{importMessage}</p>}
      {importJob && (
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/5 p-3 text-xs text-cyan-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {t({ en: "Import job", es: "Import job", pt: "Import job" })}: {importJob.importJobId}
            </p>
            <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-wide">
              {importJob.state}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cyan-100/90">
            <p>
              {t({ en: "processed", es: "procesadas", pt: "processadas" })}: {importJob.processedRows}/{importJob.totalRows}
            </p>
            <p>
              {t({ en: "failed", es: "fallidas", pt: "falhas" })}: {importJob.failedRows}
            </p>
            <p>
              {t({ en: "warnings", es: "advertencias", pt: "avisos" })}: {importJob.warningsCount}
            </p>
          </div>
          {importJob.delayed && (
            <p className="mt-2 text-[11px] text-amber-200">
              {t({
                en: "Import is delayed. Worker retry is active.",
                es: "La importacion esta demorada. El worker sigue reintentando.",
                pt: "A importacao esta atrasada. O worker segue tentando."
              })}
            </p>
          )}
          {importJob.error && (
            <p className="mt-2 text-[11px] text-rose-200">{importJob.error}</p>
          )}
          {importJob.errors.length > 0 && (
            <div className="mt-2 space-y-1 text-[11px]">
              <p className="font-semibold text-rose-100">
                {t({ en: "Top import errors", es: "Errores principales", pt: "Erros principais" })}
              </p>
              {importJob.errors.slice(0, 5).map((error, index) => (
                <p key={`${error.code}-${error.row ?? "na"}-${index}`} className="text-rose-100/90">
                  {error.row !== null ? `#${error.row} ` : ""}{error.column ? `${error.column}: ` : ""}{error.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
