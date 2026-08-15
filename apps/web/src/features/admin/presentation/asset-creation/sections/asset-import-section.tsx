import type { ChangeEvent, ClipboardEvent, DragEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { GuidedFieldHeader, GuidedTextareaField } from "@/features/admin/presentation/asset-creation/sections/guided-field";
import type { SectionT } from "@/features/admin/presentation/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetImportSectionProps = {
  t: SectionT;
  importFileName: string;
  importText: string;
  importPreviewCount: number;
  importHeaders: string[];
  importMessage: string;
  hasLoadedImport: boolean;
  replaceImportOpen: boolean;
  pendingImportLabel: string;
  isFileDropActive: boolean;
  setImportText: (value: SetStateAction<string>) => void;
  onImportFileInput: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onImportFileDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onImportFileDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onImportFileDrop: (event: DragEvent<HTMLDivElement>) => void;
  onImportTextareaPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onConfirmReplaceImport: () => void;
  onCancelReplaceImport: () => void;
};

function StatPill({ label, value }: { label: string; value: string | number }): ReactElement {
  return (
    <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-white/80">
      <span className="text-white/55">{label}:</span>{" "}
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export function AssetImportSection({
  t,
  importFileName,
  importText,
  importPreviewCount,
  importHeaders,
  importMessage,
  hasLoadedImport,
  replaceImportOpen,
  pendingImportLabel,
  isFileDropActive,
  setImportText,
  onImportFileInput,
  onImportFileDragOver,
  onImportFileDragLeave,
  onImportFileDrop,
  onImportTextareaPaste,
  onConfirmReplaceImport,
  onCancelReplaceImport
}: AssetImportSectionProps): ReactElement {
  return (
    <>
      <Card className="space-y-5 overflow-hidden border-white/12 bg-[linear-gradient(180deg,rgba(13,19,34,0.96),rgba(8,12,23,0.96))]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                {t({ en: "Step 1", es: "Paso 1", pt: "Passo 1" })}
              </p>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {t({ en: "Quick import", es: "Importacion rapida", pt: "Importacao rapida" })}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-white/68">
                  {t({
                    en: "Start with a spreadsheet-style import. We detect the first valid row and apply the preview automatically so you can review and complete the form below.",
                    es: "Empieza con una importacion tipo hoja de calculo. Detectamos la primera fila valida y aplicamos la vista previa automaticamente para que revises y completes el formulario abajo.",
                    pt: "Comece com uma importacao estilo planilha. Detectamos a primeira linha valida e aplicamos a pre-visualizacao automaticamente para que voce revise e complete o formulario abaixo."
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatPill label={t({ en: "Columns", es: "Columnas", pt: "Colunas" })} value={importHeaders.length} />
              <StatPill label={t({ en: "Rows", es: "Filas", pt: "Linhas" })} value={importPreviewCount} />
              <StatPill
                label={t({ en: "Mode", es: "Modo", pt: "Modo" })}
                value={hasLoadedImport
                  ? t({ en: "Loaded", es: "Cargado", pt: "Carregado" })
                  : t({ en: "Waiting", es: "Esperando", pt: "Aguardando" })}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="space-y-3">
              <div className="space-y-1 text-xs text-white/70">
                <p className="text-sm font-semibold text-white">
                  {t({ en: "Upload a file", es: "Sube un archivo", pt: "Envie um arquivo" })}
                </p>
                <GuidedFieldHeader
                  label={t({ en: "Import file", es: "Archivo de importacion", pt: "Arquivo de importacao" })}
                  hint={t({ en: "Use a structured export to prefill the form automatically.", es: "Usa una exportacion estructurada para rellenar el formulario automaticamente.", pt: "Use uma exportacao estruturada para preencher o formulario automaticamente." })}
                  tooltip={t({ en: "Supported today: CSV, TXT, TSV, and the standard investment brief PDF. Valid imports apply their preview automatically.", es: "Disponible hoy: CSV, TXT, TSV y el PDF estandar del brief de inversion. Las importaciones validas aplican su vista previa automaticamente.", pt: "Disponivel hoje: CSV, TXT, TSV e o PDF padrao do brief de investimento. Importacoes validas aplicam a pre-visualizacao automaticamente." })}
                  ariaLabel={t({ en: "Import file help", es: "Ayuda de archivo de importacion", pt: "Ajuda de arquivo de importacao" })}
                />
              </div>
              <div
                data-testid="quick-import-dropzone"
                className={`flex min-h-[148px] flex-col items-start justify-between rounded-2xl border border-dashed p-4 transition ${
                  isFileDropActive ? "border-cyan-300/70 bg-cyan-500/10" : "border-white/15 bg-slate-950/40"
                }`}
                onDragOver={onImportFileDragOver}
                onDragLeave={onImportFileDragLeave}
                onDrop={onImportFileDrop}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/85">
                    {t({
                      en: "Choose a spreadsheet export from your deal workflow.",
                      es: "Elige una exportacion de hoja de calculo de tu flujo del deal.",
                      pt: "Escolha uma exportacao de planilha do seu fluxo do deal."
                    })}
                  </p>
                  <p className="text-xs leading-5 text-white/55">
                    {importFileName || t({ en: "No file selected yet", es: "Aun no hay archivo seleccionado", pt: "Ainda nao ha arquivo selecionado" })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="quick-import-file"
                    className="sr-only"
                    type="file"
                    accept=".csv,.txt,.tsv,.pdf,.xls,.xlsx"
                    onChange={(event) => { void onImportFileInput(event); }}
                  />
                  <label
                    htmlFor="quick-import-file"
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
                  >
                    {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">
                {t({ en: "Paste from Excel", es: "Pega desde Excel", pt: "Cole do Excel" })}
              </p>
              <GuidedTextareaField
                label={t({ en: "Pasted table", es: "Tabla pegada", pt: "Tabela colada" })}
                hint={t({ en: "Paste copied rows with headers so the first valid row can be applied.", es: "Pega filas copiadas con encabezados para aplicar la primera fila valida.", pt: "Cole linhas copiadas com cabecalhos para aplicar a primeira linha valida." })}
                tooltip={t({ en: "This accepts spreadsheet-like tabular content and detects headers automatically.", es: "Esto acepta contenido tabular tipo hoja de calculo y detecta encabezados automaticamente.", pt: "Isto aceita conteudo tabular tipo planilha e detecta cabecalhos automaticamente." })}
                ariaLabel={t({ en: "Pasted table help", es: "Ayuda de tabla pegada", pt: "Ajuda de tabela colada" })}
                className="min-h-[148px] w-full resize-none border-white/12 bg-slate-950/55 text-base leading-6 transition focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
                placeholder={t({
                  en: "Paste tabular content with a header row.",
                  es: "Pega contenido tabular con fila de encabezados.",
                  pt: "Cole conteudo tabular com linha de cabecalho."
                })}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                onPaste={onImportTextareaPaste}
              />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
          <div className={`h-2.5 w-2.5 rounded-full ${importMessage ? "bg-cyan-300" : "bg-white/25"}`} />
          <p className="text-sm text-white/78">
            {importMessage || t({
              en: "Upload a file or paste a table to start the automatic preview.",
              es: "Sube un archivo o pega una tabla para iniciar la vista previa automatica.",
              pt: "Envie um arquivo ou cole uma tabela para iniciar a pre-visualizacao automatica."
            })}
          </p>
        </div>
      </Card>

      {replaceImportOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-md sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-import-modal-title"
            className="glass-surface w-full max-w-xl overflow-hidden rounded-[26px] border border-white/12"
          >
            <div className="border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
                {t({ en: "Replace import", es: "Reemplazar importacion", pt: "Substituir importacao" })}
              </p>
              <h3 id="replace-import-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {t({
                  en: "Load a new import and replace the current one?",
                  es: "¿Cargar una nueva importacion y reemplazar la actual?",
                  pt: "Carregar uma nova importacao e substituir a atual?"
                })}
              </h3>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-sm leading-6 text-white/72">
                {t({
                  en: "Your current imported values will be lost and replaced with the newly loaded data.",
                  es: "Los valores importados actualmente se perderan y se reemplazaran con los datos recien cargados.",
                  pt: "Os valores importados atualmente serao perdidos e substituidos pelos dados recem-carregados."
                })}
              </p>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white/80">
                <span className="text-white/55">{t({ en: "New source", es: "Nueva fuente", pt: "Nova fonte" })}:</span>{" "}
                <span className="font-semibold text-white">{pendingImportLabel}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button className="min-h-11" variant="ghost" onClick={onCancelReplaceImport}>
                  {t({ en: "Keep current import", es: "Mantener importacion actual", pt: "Manter importacao atual" })}
                </Button>
                <Button className="min-h-11" onClick={onConfirmReplaceImport}>
                  {t({ en: "Replace import", es: "Reemplazar importacion", pt: "Substituir importacao" })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
