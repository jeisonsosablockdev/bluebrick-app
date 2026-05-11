"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useState } from "react";

import { formatAdminCollectionDocumentTag } from "@/components/admin/admin-collection-document-copy";
import { AdminCollectionDetailSectionShell } from "@/components/admin/admin-collection-detail-section-primitives";
import {
  createEmptyAdminCollectionDocumentDraft,
  AdminCollectionDocumentsMutationError,
  isAdminCollectionDocumentsDirty,
  updateAdminCollectionDocuments,
  type AdminCollectionDocumentDraft
} from "@/lib/admin/admin-collection-documents-client";
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

function toDraftDocuments(items: CollectionBootstrapDocumentItem[]): AdminCollectionDocumentDraft[] {
  return items.map((item, index) => ({
    ...item,
    displayOrder: index + 1
  }));
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
        {draft.source}
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
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">
            {localize(locale, {
              en: `Document ${index + 1}`,
              es: `Documento ${index + 1}`,
              pt: `Documento ${index + 1}`
            })}
          </p>
          <DocumentMetadataPills draft={draft} locale={locale} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
            onClick={onRemove}
            type="button"
          >
            {localize(locale, { en: "Remove document", es: "Eliminar documento", pt: "Remover documento" })}
          </button>
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

  const dirty = isAdminCollectionDocumentsDirty({
    persistedDocuments,
    draftDocuments
  });

  async function handleSave(): Promise<void> {
    if (!dirty || feedback.kind === "saving") {
      return;
    }

    setFeedback({ kind: "saving" });

    try {
      const updatedContent = await updateAdminCollectionDocuments({
        entryId,
        documents: draftDocuments
      });
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
        en: "Documents now have a dedicated section-level editor so categories, links, and inherited upload metadata can evolve without reopening summary or gallery flows.",
        es: "Documents ahora tiene un editor dedicado por seccion para que categorias, enlaces y metadata heredada de uploads evolucionen sin reabrir summary ni gallery.",
        pt: "Documents agora tem um editor dedicado por secao para que categorias, links e metadata herdada de uploads evoluam sem reabrir summary nem gallery."
      })}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      title={localize(locale, { en: "Documents", es: "Documents", pt: "Documents" })}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">
              {localize(locale, { en: "Document list", es: "Lista de documentos", pt: "Lista de documentos" })}
            </p>
            <p className="text-sm text-white/55">
              {localize(locale, {
                en: "Existing upload metadata stays attached to each row when available. New rows default to marketplace-managed links until file-upload integration is layered in.",
                es: "La metadata de uploads existentes se mantiene adjunta a cada fila cuando exista. Las nuevas filas usan enlaces gestionados por marketplace hasta que la integracion de subida de archivos llegue en el siguiente slice.",
                pt: "A metadata de uploads existentes permanece anexada a cada linha quando disponivel. Novas linhas usam links geridos pelo marketplace ate a integracao de upload de arquivos chegar no proximo slice."
              })}
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            onClick={() => {
              setDraftDocuments((current) => [
                ...current,
                createEmptyAdminCollectionDocumentDraft({ index: current.length })
              ]);
              setFeedback({ kind: "idle" });
            }}
            type="button"
          >
            {localize(locale, { en: "Add document", es: "Agregar documento", pt: "Adicionar documento" })}
          </button>
        </div>

        <div className="space-y-4">
          {draftDocuments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/60">
              {localize(locale, {
                en: "No documents are linked yet. Add the first document row and save this section when ready.",
                es: "Aun no hay documentos vinculados. Agrega la primera fila y guarda esta seccion cuando este lista.",
                pt: "Ainda nao ha documentos vinculados. Adicione a primeira linha e salve esta secao quando estiver pronta."
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
              disabled={!dirty || feedback.kind === "saving"}
              onClick={handleCancel}
              type="button"
            >
              {localize(locale, { en: "Cancel", es: "Cancel", pt: "Cancelar" })}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!dirty || feedback.kind === "saving"}
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
