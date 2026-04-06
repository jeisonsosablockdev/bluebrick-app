import type { ChangeEvent, DragEvent, ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { AssetForm, FileUploadField } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetMediaSectionProps = {
  t: SectionT;
  form: AssetForm;
  dragTargetField: FileUploadField | null;
  setForm: (value: SetStateAction<AssetForm>) => void;
  onFileDragOver: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileDragLeave: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileDrop: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (field: FileUploadField) => (event: ChangeEvent<HTMLInputElement>) => void;
  uploadFieldValue: (field: FileUploadField) => string;
  renderUploadFieldFeedback: (field: FileUploadField) => ReactElement | null;
};

export function AssetMediaSection({
  t,
  form,
  dragTargetField,
  setForm,
  onFileDragOver,
  onFileDragLeave,
  onFileDrop,
  onFileInput,
  uploadFieldValue,
  renderUploadFieldFeedback
}: AssetMediaSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Media and documents", es: "Media y documentos", pt: "Midia e documentos" })}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          {t({ en: "coverImage (required)", es: "coverImage (obligatoria)", pt: "coverImage (obrigatoria)" })}
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "coverImage"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("coverImage")}
            onDragLeave={onFileDragLeave("coverImage")}
            onDrop={onFileDrop("coverImage")}
          >
            <input id="upload-coverImage" className="sr-only" type="file" onChange={onFileInput("coverImage")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-coverImage">
              {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.coverImage || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          {renderUploadFieldFeedback("coverImage")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          galleryImages[]
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "galleryImages"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("galleryImages")}
            onDragLeave={onFileDragLeave("galleryImages")}
            onDrop={onFileDrop("galleryImages")}
          >
            <input id="upload-galleryImages" className="sr-only" type="file" multiple onChange={onFileInput("galleryImages")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-galleryImages">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("galleryImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("galleryImages")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          brochureFile
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "brochureFile"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("brochureFile")}
            onDragLeave={onFileDragLeave("brochureFile")}
            onDrop={onFileDrop("brochureFile")}
          >
            <input id="upload-brochureFile" className="sr-only" type="file" onChange={onFileInput("brochureFile")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-brochureFile">
              {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.brochureFile || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          {renderUploadFieldFeedback("brochureFile")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          legalDocs[]
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "legalDocs"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("legalDocs")}
            onDragLeave={onFileDragLeave("legalDocs")}
            onDrop={onFileDrop("legalDocs")}
          >
            <input id="upload-legalDocs" className="sr-only" type="file" multiple onChange={onFileInput("legalDocs")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-legalDocs">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("legalDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("legalDocs")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          financialDocs[]
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "financialDocs"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("financialDocs")}
            onDragLeave={onFileDragLeave("financialDocs")}
            onDrop={onFileDrop("financialDocs")}
          >
            <input id="upload-financialDocs" className="sr-only" type="file" multiple onChange={onFileInput("financialDocs")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-financialDocs">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("financialDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("financialDocs")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          propertyImages[]
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "propertyImages"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("propertyImages")}
            onDragLeave={onFileDragLeave("propertyImages")}
            onDrop={onFileDrop("propertyImages")}
          >
            <input id="upload-propertyImages" className="sr-only" type="file" multiple onChange={onFileInput("propertyImages")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-propertyImages">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("propertyImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("propertyImages")}
        </label>
      </div>
      <Input placeholder={t({ en: "videoUrl optional", es: "videoUrl opcional", pt: "videoUrl opcional" })} value={form.videoUrl} onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
    </Card>
  );
}
