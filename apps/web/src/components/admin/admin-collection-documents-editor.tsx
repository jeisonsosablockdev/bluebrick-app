"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useState } from "react";
import type { DragEvent, ChangeEvent } from "react";

import { formatAdminCollectionDocumentTag } from "@/components/admin/admin-collection-document-copy";
import { AdminCollectionDetailSectionShell } from "@/components/admin/admin-collection-detail-section-primitives";
import {
  createEmptyAdminCollectionDocumentDraft,
  createUploadedAdminCollectionDocumentDraft,
  AdminCollectionDocumentsMutationError,
  isAdminCollectionDocumentsDirty,
  updateAdminCollectionDocuments,
  type AdminCollectionDocumentDraft
} from "@/lib/admin/admin-collection-documents-client";
import {
  promoteAssetUploadEditSession,
  uploadAssetFileViaClientBlob
} from "@/lib/admin/asset-upload-client";
import type {
  CollectionBootstrapDocumentItem,
  CollectionBootstrapDocumentTag
} from "@/lib/admin/collection-bootstrap-mapper";
import { localize, type AppLocale } from "@/lib/i18n";

type DocumentsFeedbackState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type DocumentsUploadState =
  | { kind: "idle"; dragActive: boolean }
  | { kind: "uploading"; dragActive: boolean; message: string }
  | { kind: "success"; dragActive: boolean; message: string }
  | { kind: "error"; dragActive: boolean; message: string };

const DOCUMENT_TAGS: CollectionBootstrapDocumentTag[] = [
  "brochure",
  "legal",
  "financial",
  "title-report",
  "appraisal",
  "lease",
  "agreement",
  "inspection",
  "tax",
  "insurance",
  "permit",
  "floor-plan",
  "other"
];

type AdminCollectionDocumentsEditorProps = {
  entryId: string;
  locale: AppLocale;
  initialDocuments: CollectionBootstrapDocumentItem[];
};

type DocumentsWorkspaceSummary = {
  total: number;
  uploads: number;
  manualLinks: number;
};

function toDraftDocuments(items: CollectionBootstrapDocumentItem[]): AdminCollectionDocumentDraft[] {
  return items.map((item, index) => ({
    ...item,
    displayOrder: index + 1
  }));
}

function summarizeDraftDocuments(items: AdminCollectionDocumentDraft[]): DocumentsWorkspaceSummary {
  const uploads = items.filter((item) => item.source === "upload").length;

  return {
    total: items.length,
    uploads,
    manualLinks: items.length - uploads
  };
}

function formatDocumentCount(locale: AppLocale, count: number): string {
  if (count === 1) {
    return localize(locale, { en: "1 document", es: "1 documento", pt: "1 documento" });
  }

  return localize(locale, {
    en: `${count} documents`,
    es: `${count} documentos`,
    pt: `${count} documentos`
  });
}

function formatUploadCount(locale: AppLocale, count: number): string {
  if (count === 1) {
    return localize(locale, { en: "1 upload", es: "1 subida", pt: "1 upload" });
  }

  return localize(locale, {
    en: `${count} uploads`,
    es: `${count} subidas`,
    pt: `${count} uploads`
  });
}

function formatManualLinkCount(locale: AppLocale, count: number): string {
  if (count === 1) {
    return localize(locale, { en: "1 manual link", es: "1 enlace manual", pt: "1 link manual" });
  }

  return localize(locale, {
    en: `${count} manual links`,
    es: `${count} enlaces manuales`,
    pt: `${count} links manuais`
  });
}

function createLocalUuid(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) => {
    const value = Number(character);
    return (value ^ Math.random() * 16 >> value / 4).toString(16);
  });
}

function uploadMessage(locale: AppLocale, state: DocumentsUploadState): string {
  if (state.kind === "uploading" || state.kind === "success" || state.kind === "error") {
    return state.message;
  }

  return localize(locale, {
    en: "Files are uploaded to Vercel Blob first, then added as unsaved document rows.",
    es: "Los archivos se suben primero a Vercel Blob y luego se agregan como filas de documentos sin guardar.",
    pt: "Os arquivos sao enviados primeiro ao Vercel Blob e depois adicionados como linhas de documentos nao salvas."
  });
}

function DocumentsStatusPill({
  locale,
  feedback,
  dirty
}: {
  locale: AppLocale;
  feedback: DocumentsFeedbackState;
  dirty: boolean;
}): ReactElement {
  if (feedback.kind === "saving") {
    return (
      <span className="inline-flex min-h-9 items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
        {localize(locale, { en: "Saving", es: "Guardando", pt: "Salvando" })}
      </span>
    );
  }

  if (feedback.kind === "success") {
    return (
      <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
        {localize(locale, { en: "Saved", es: "Guardado", pt: "Salvo" })}
      </span>
    );
  }

  if (feedback.kind === "error") {
    return (
      <span className="inline-flex min-h-9 items-center rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-100">
        {localize(locale, { en: "Save failed", es: "Error al guardar", pt: "Falha ao salvar" })}
      </span>
    );
  }

  if (dirty) {
    return (
      <span className="inline-flex min-h-9 items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
        {localize(locale, { en: "Unsaved changes", es: "Cambios sin guardar", pt: "Alteracoes nao salvas" })}
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
      {localize(locale, { en: "Documents editor", es: "Editor de documentos", pt: "Editor de documentos" })}
    </span>
  );
}

function DocumentsStatusMessage({
  locale,
  feedback,
  dirty
}: {
  locale: AppLocale;
  feedback: DocumentsFeedbackState;
  dirty: boolean;
}): ReactElement {
  let message = localize(locale, {
    en: "No unsaved document changes. Uploaded file metadata remains visible while this section saves independently.",
    es: "No hay cambios pendientes en documentos. La metadata del archivo subido sigue visible mientras esta seccion se guarda de forma independiente.",
    pt: "Nao ha alteracoes pendentes em documentos. A metadata do arquivo enviado permanece visivel enquanto esta secao salva de forma independente."
  });
  let toneClass = "text-white/55";

  if (dirty) {
    message = localize(locale, {
      en: "Document metadata changes stay local until you save this section.",
      es: "Los cambios de metadata de documentos permanecen locales hasta que guardes esta seccion.",
      pt: "As alteracoes de metadata dos documentos permanecem locais ate voce salvar esta secao."
    });
    toneClass = "text-amber-100";
  }

  if (feedback.kind === "saving") {
    message = localize(locale, {
      en: "Saving only the documents section. Summary, property information, and gallery remain untouched.",
      es: "Guardando solo la seccion de documentos. Summary, property information y gallery no cambian.",
      pt: "Salvando apenas a secao de documentos. Summary, property information e gallery permanecem intactos."
    });
    toneClass = "text-sky-100";
  } else if (feedback.kind === "success") {
    message = localize(locale, {
      en: "Documents saved. The latest persisted document list is already reflected below.",
      es: "Documentos guardados. La ultima lista persistida ya se refleja abajo.",
      pt: "Documentos salvos. A lista persistida mais recente ja aparece abaixo."
    });
    toneClass = "text-emerald-100";
  } else if (feedback.kind === "error") {
    message = feedback.message;
    toneClass = "text-rose-100";
  }

  return (
    <p aria-live="polite" className={`text-sm ${toneClass}`}>
      {message}
    </p>
  );
}

function WorkspaceMetric({
  label,
  value
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="min-h-14 rounded-lg border border-white/10 bg-black/10 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{value}</p>
    </div>
  );
}

function DocumentsWorkspaceSummaryBar({
  locale,
  summary
}: {
  locale: AppLocale;
  summary: DocumentsWorkspaceSummary;
}): ReactElement {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <WorkspaceMetric
        label={localize(locale, { en: "Rows", es: "Filas", pt: "Linhas" })}
        value={formatDocumentCount(locale, summary.total)}
      />
      <WorkspaceMetric
        label={localize(locale, { en: "Canonical", es: "Canonico", pt: "Canonico" })}
        value={formatUploadCount(locale, summary.uploads)}
      />
      <WorkspaceMetric
        label={localize(locale, { en: "Fallback", es: "Fallback", pt: "Fallback" })}
        value={formatManualLinkCount(locale, summary.manualLinks)}
      />
    </div>
  );
}

function DocumentMetadataPills({
  locale,
  draft
}: {
  locale: AppLocale;
  draft: AdminCollectionDocumentDraft;
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
        {formatAdminCollectionDocumentTag(locale, draft.tag)}
      </span>
      <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
        {draft.source === "upload"
          ? localize(locale, { en: "Upload", es: "Subida", pt: "Upload" })
          : localize(locale, { en: "Manual link", es: "Enlace manual", pt: "Link manual" })}
      </span>
      {draft.fileName ? (
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
          {draft.fileName}
        </span>
      ) : null}
      {draft.fileRefId ? (
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
          fileRefId: {draft.fileRefId}
        </span>
      ) : null}
    </div>
  );
}

function DocumentCard({
  locale,
  draft,
  index,
  onChange,
  onRemove
}: {
  locale: AppLocale;
  draft: AdminCollectionDocumentDraft;
  index: number;
  onChange: (nextDraft: AdminCollectionDocumentDraft) => void;
  onRemove: () => void;
}): ReactElement {
  const heading = draft.label.trim() || draft.title.trim() || localize(locale, {
    en: `Document ${index + 1}`,
    es: `Documento ${index + 1}`,
    pt: `Documento ${index + 1}`
  });

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-black/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
            {localize(locale, {
              en: `Document ${index + 1}`,
              es: `Documento ${index + 1}`,
              pt: `Documento ${index + 1}`
            })}
          </p>
          <h4 className="break-words text-base font-semibold text-white">{heading}</h4>
          <DocumentMetadataPills draft={draft} locale={locale} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
            href={draft.url.trim() || "#"}
            onClick={(event) => {
              if (!draft.url.trim()) {
                event.preventDefault();
              }
            }}
            rel="noreferrer"
            target="_blank"
          >
            {localize(locale, { en: "Open draft link", es: "Abrir enlace", pt: "Abrir link" })}
          </Link>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
            onClick={onRemove}
            type="button"
          >
            {localize(locale, { en: "Remove document", es: "Eliminar documento", pt: "Remover documento" })}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">{localize(locale, { en: "Tag", es: "Tag", pt: "Tag" })}</span>
          <select
            className="min-h-11 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            onChange={(event) => {
              onChange({ ...draft, tag: event.target.value as CollectionBootstrapDocumentTag });
            }}
            value={draft.tag}
          >
                {DOCUMENT_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {formatAdminCollectionDocumentTag(locale, tag)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">{localize(locale, { en: "Label", es: "Label", pt: "Label" })}</span>
          <input
            className="min-h-11 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            onChange={(event) => {
              onChange({ ...draft, label: event.target.value });
            }}
            value={draft.label}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">{localize(locale, { en: "Title", es: "Titulo", pt: "Titulo" })}</span>
          <input
            className="min-h-11 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            onChange={(event) => {
              onChange({ ...draft, title: event.target.value });
            }}
            value={draft.title}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">{localize(locale, { en: "Document URL", es: "URL del documento", pt: "URL do documento" })}</span>
          <input
            className="min-h-11 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            onChange={(event) => {
              onChange({ ...draft, url: event.target.value });
            }}
            placeholder="https://cdn.example.com/document.pdf"
            value={draft.url}
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-white/80">{localize(locale, { en: "Description", es: "Descripcion", pt: "Descricao" })}</span>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
          onChange={(event) => {
            onChange({ ...draft, description: event.target.value });
          }}
          value={draft.description}
        />
      </label>
    </div>
  );
}

export function AdminCollectionDocumentsEditor({
  entryId,
  locale,
  initialDocuments
}: AdminCollectionDocumentsEditorProps): ReactElement {
  const [persistedDocuments, setPersistedDocuments] = useState<CollectionBootstrapDocumentItem[]>(initialDocuments);
  const [draftDocuments, setDraftDocuments] = useState<AdminCollectionDocumentDraft[]>(toDraftDocuments(initialDocuments));
  const [feedback, setFeedback] = useState<DocumentsFeedbackState>({ kind: "idle" });
  const [uploadState, setUploadState] = useState<DocumentsUploadState>({ kind: "idle", dragActive: false });
  const [uploadDraftId] = useState(() => createLocalUuid());
  const [uploadEditSessionId] = useState(() => createLocalUuid());
  const [hasUnpromotedUploads, setHasUnpromotedUploads] = useState(false);

  const dirty = isAdminCollectionDocumentsDirty({
    persistedDocuments,
    draftDocuments
  });
  const workspaceSummary = summarizeDraftDocuments(draftDocuments);

  function handleAddManualDocument(): void {
    setDraftDocuments((current) => [
      ...current,
      createEmptyAdminCollectionDocumentDraft({ index: current.length })
    ]);
    setFeedback({ kind: "idle" });
  }

  async function uploadDocumentFiles(files: File[]): Promise<void> {
    const filesToUpload = files.filter((file) => file.size > 0);
    if (filesToUpload.length === 0 || uploadState.kind === "uploading") {
      return;
    }

    setUploadState({
      kind: "uploading",
      dragActive: false,
      message: localize(locale, {
        en: "Uploading documents...",
        es: "Subiendo documentos...",
        pt: "Enviando documentos..."
      })
    });

    const uploadedDrafts: AdminCollectionDocumentDraft[] = [];
    const failed: string[] = [];

    for (const [index, file] of filesToUpload.entries()) {
      setUploadState({
        kind: "uploading",
        dragActive: false,
        message: localize(locale, {
          en: `Uploading ${index + 1}/${filesToUpload.length}: ${file.name}`,
          es: `Subiendo ${index + 1}/${filesToUpload.length}: ${file.name}`,
          pt: `Enviando ${index + 1}/${filesToUpload.length}: ${file.name}`
        })
      });

      try {
        const upload = await uploadAssetFileViaClientBlob({
          file,
          category: "brochureFile",
          draftId: uploadDraftId,
          editSessionId: uploadEditSessionId
        });

        uploadedDrafts.push(createUploadedAdminCollectionDocumentDraft({
          index: draftDocuments.length + uploadedDrafts.length,
          file,
          upload
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error.";
        failed.push(`${file.name}: ${message}`);
      }
    }

    if (uploadedDrafts.length > 0) {
      setDraftDocuments((current) => [
        ...current,
        ...uploadedDrafts.map((draft, offset) => ({
          ...draft,
          displayOrder: current.length + offset + 1
        }))
      ]);
      setHasUnpromotedUploads(true);
      setFeedback({ kind: "idle" });
    }

    if (failed.length > 0) {
      setUploadState({
        kind: "error",
        dragActive: false,
        message: failed.join(" | ")
      });
      return;
    }

    setUploadState({
      kind: "success",
      dragActive: false,
      message: localize(locale, {
        en: `${uploadedDrafts.length} document(s) uploaded. Save this section to persist them.`,
        es: `${uploadedDrafts.length} documento(s) subidos. Guarda esta seccion para persistirlos.`,
        pt: `${uploadedDrafts.length} documento(s) enviados. Salve esta secao para persisti-los.`
      })
    });
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadDocumentFiles(files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (!uploadState.dragActive) {
      setUploadState((current) => ({ ...current, dragActive: true }));
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setUploadState((current) => ({ ...current, dragActive: false }));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setUploadState((current) => ({ ...current, dragActive: false }));
    void uploadDocumentFiles(Array.from(event.dataTransfer.files ?? []));
  }

  async function handleSave(): Promise<void> {
    if (!dirty || feedback.kind === "saving" || uploadState.kind === "uploading") {
      return;
    }

    setFeedback({ kind: "saving" });

    try {
      const updatedContent = await updateAdminCollectionDocuments({
        entryId,
        documents: draftDocuments
      });

      if (hasUnpromotedUploads) {
        await promoteAssetUploadEditSession({
          draftId: uploadDraftId,
          editSessionId: uploadEditSessionId
        });
        setHasUnpromotedUploads(false);
      }

      const nextPersistedDocuments = updatedContent.documents;

      setPersistedDocuments(nextPersistedDocuments);
      setDraftDocuments(toDraftDocuments(nextPersistedDocuments));
      setFeedback({ kind: "success" });
    } catch (error) {
      const message = error instanceof AdminCollectionDocumentsMutationError
        ? error.message
        : localize(locale, {
          en: "Could not save the documents section.",
          es: "No se pudo guardar la seccion de documentos.",
          pt: "Nao foi possivel salvar a secao de documentos."
        });

      setFeedback({ kind: "error", message });
    }
  }

  function handleCancel(): void {
    setDraftDocuments(toDraftDocuments(persistedDocuments));
    setFeedback({ kind: "idle" });
  }

  return (
    <AdminCollectionDetailSectionShell
      aside={<DocumentsStatusPill dirty={dirty} feedback={feedback} locale={locale} />}
      description={localize(locale, {
        en: "Manage public documents with canonical uploads first and manual links as the fallback.",
        es: "Gestiona documentos publicos con subidas canonicas primero y enlaces manuales como fallback.",
        pt: "Gerencie documentos publicos com uploads canonicos primeiro e links manuais como fallback."
      })}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      title={localize(locale, { en: "Documents", es: "Documents", pt: "Documents" })}
    >
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {localize(locale, { en: "Document workspace", es: "Workspace de documentos", pt: "Workspace de documentos" })}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-white/60">
                {localize(locale, {
                  en: "Upload files for the canonical path, or add a manual link when a document already lives in an approved CDN.",
                  es: "Sube archivos para el camino canonico, o agrega un enlace manual cuando el documento ya viva en un CDN aprobado.",
                  pt: "Envie arquivos pelo caminho canonico, ou adicione um link manual quando o documento ja estiver em um CDN aprovado."
                })}
              </p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              onClick={handleAddManualDocument}
              type="button"
            >
              {localize(locale, { en: "Manual link fallback", es: "Fallback de enlace manual", pt: "Fallback de link manual" })}
            </button>
          </div>

          <DocumentsWorkspaceSummaryBar locale={locale} summary={workspaceSummary} />
        </div>

        <div
          className={`rounded-lg border border-dashed p-4 transition ${
            uploadState.dragActive
              ? "border-sky-300/60 bg-sky-400/10"
              : "border-white/15 bg-white/[0.03]"
          }`}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                {localize(locale, { en: "Upload or link documents", es: "Subir o enlazar documentos", pt: "Enviar ou vincular documentos" })}
              </p>
              <p className="text-sm font-semibold text-white">
                {localize(locale, { en: "Upload documents", es: "Subir documentos", pt: "Enviar documentos" })}
              </p>
              <p className="text-sm text-white/60">
                {localize(locale, {
                  en: "Drag and drop files here. Uploads use the canonical Vercel Blob pipeline.",
                  es: "Arrastra archivos aqui. Las subidas usan el flujo canonico de Vercel Blob.",
                  pt: "Arraste arquivos aqui. Os uploads usam o fluxo canonico do Vercel Blob."
                })}
              </p>
              <p className="text-sm text-white/55">
                {localize(locale, {
                  en: "PDF, CSV, XLS, and XLSX files are limited to 10 MB. If a PDF is too large, compress it with ",
                  es: "Los archivos PDF, CSV, XLS y XLSX tienen limite de 10 MB. Si un PDF pesa demasiado, comprimelo con ",
                  pt: "Arquivos PDF, CSV, XLS e XLSX tem limite de 10 MB. Se um PDF for muito grande, comprima com "
                })}
                <a
                  className="font-semibold text-sky-100 underline decoration-sky-100/50 underline-offset-4 transition hover:text-white"
                  href="https://www.ilovepdf.com/compress_pdf"
                  rel="noreferrer"
                  target="_blank"
                >
                  iLovePDF
                </a>
                .
              </p>
              <p aria-live="polite" className={`text-sm ${
                uploadState.kind === "error"
                  ? "text-rose-100"
                  : uploadState.kind === "success"
                    ? "text-emerald-100"
                    : uploadState.kind === "uploading"
                      ? "text-sky-100"
                      : "text-white/50"
              }`}>
                {uploadMessage(locale, uploadState)}
              </p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              <input
                accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={uploadState.kind === "uploading"}
                multiple
                onChange={handleFileInput}
                type="file"
              />
              {uploadState.kind === "uploading"
                ? localize(locale, { en: "Uploading", es: "Subiendo", pt: "Enviando" })
                : localize(locale, { en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {draftDocuments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/60">
              {localize(locale, {
                en: "No documents yet. Upload files or add a manual link to create the first row.",
                es: "Aun no hay documentos. Sube archivos o agrega un enlace manual para crear la primera fila.",
                pt: "Ainda nao ha documentos. Envie arquivos ou adicione um link manual para criar a primeira linha."
              })}
            </div>
          ) : (
            draftDocuments.map((draft, index) => (
              <DocumentCard
                key={draft.id}
                draft={draft}
                index={index}
                locale={locale}
                onChange={(nextDraft) => {
                  setDraftDocuments((current) => current.map((item, itemIndex) => (
                    itemIndex === index
                      ? { ...nextDraft, displayOrder: index + 1 }
                      : { ...item, displayOrder: itemIndex + 1 }
                  )));
                  setFeedback({ kind: "idle" });
                }}
                onRemove={() => {
                  setDraftDocuments((current) => current
                    .filter((_, itemIndex) => itemIndex !== index)
                    .map((item, itemIndex) => ({
                      ...item,
                      displayOrder: itemIndex + 1
                    })));
                  setFeedback({ kind: "idle" });
                }}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <DocumentsStatusMessage dirty={dirty} feedback={feedback} locale={locale} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/75 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!dirty || feedback.kind === "saving" || uploadState.kind === "uploading"}
              onClick={handleCancel}
              type="button"
            >
              {localize(locale, { en: "Cancel", es: "Cancel", pt: "Cancelar" })}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!dirty || feedback.kind === "saving" || uploadState.kind === "uploading"}
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              {feedback.kind === "saving"
                ? localize(locale, { en: "Saving documents", es: "Guardando documentos", pt: "Salvando documentos" })
                : localize(locale, { en: "Save documents", es: "Guardar documentos", pt: "Salvar documentos" })}
            </button>
          </div>
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
