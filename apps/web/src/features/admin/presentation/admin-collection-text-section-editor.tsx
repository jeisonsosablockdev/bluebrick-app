"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import { AdminCollectionDetailSectionShell } from "@/features/admin/presentation/admin-collection-detail-section-primitives";
import {
  AdminCollectionTextSectionMutationError,
  isAdminCollectionTextSectionDirty,
  updateAdminCollectionTextSection,
  type AdminCollectionTextSection
} from "@/lib/admin/admin-collection-text-section-client";
import { localize, type AppLocale } from "@/lib/i18n";

type TextSectionFeedbackState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type AdminCollectionTextSectionEditorCopy = {
  idlePill: string;
  fieldLabel: string;
  placeholder: string;
  saveLabel: string;
  savingLabel: string;
  dirtyMessage: string;
  savingMessage: string;
  successMessage: string;
  fallbackErrorMessage: string;
};

type AdminCollectionTextSectionEditorProps = {
  entryId: string;
  locale: AppLocale;
  section: AdminCollectionTextSection;
  initialValue: string | null;
  title: string;
  eyebrow: string;
  description: string;
  fieldId: string;
  copy: AdminCollectionTextSectionEditorCopy;
  onSavedValueChange?: (nextValue: string | null) => void;
};

function TextSectionStatusPill({
  locale,
  dirty,
  feedback,
  idlePill
}: {
  locale: AppLocale;
  dirty: boolean;
  feedback: TextSectionFeedbackState;
  idlePill: string;
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
      {idlePill}
    </span>
  );
}

function TextSectionStatusMessage({
  feedback,
  dirty,
  idleMessage,
  dirtyMessage,
  savingMessage,
  successMessage
}: {
  feedback: TextSectionFeedbackState;
  dirty: boolean;
  idleMessage: string;
  dirtyMessage: string;
  savingMessage: string;
  successMessage: string;
}): ReactElement {
  let message = idleMessage;
  let toneClass = "text-white/55";

  if (dirty) {
    message = dirtyMessage;
    toneClass = "text-amber-100";
  }

  if (feedback.kind === "saving") {
    message = savingMessage;
    toneClass = "text-sky-100";
  } else if (feedback.kind === "success") {
    message = successMessage;
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

export function AdminCollectionTextSectionEditor({
  entryId,
  locale,
  section,
  initialValue,
  title,
  eyebrow,
  description,
  fieldId,
  copy,
  onSavedValueChange
}: AdminCollectionTextSectionEditorProps): ReactElement {
  const [persistedValue, setPersistedValue] = useState<string | null>(initialValue);
  const [draftValue, setDraftValue] = useState(initialValue ?? "");
  const [feedback, setFeedback] = useState<TextSectionFeedbackState>({ kind: "idle" });

  const dirty = isAdminCollectionTextSectionDirty({
    persistedValue,
    draftValue
  });

  async function handleSave(): Promise<void> {
    if (!dirty || feedback.kind === "saving") {
      return;
    }

    setFeedback({ kind: "saving" });

    try {
      const updatedContent = await updateAdminCollectionTextSection({
        entryId,
        section,
        value: draftValue
      });
      const nextPersistedValue =
        section === "summary"
          ? updatedContent.fractionalInvestmentSummary
          : updatedContent.propertyInformation;

      setPersistedValue(nextPersistedValue);
      setDraftValue(nextPersistedValue ?? "");
      setFeedback({ kind: "success" });
      onSavedValueChange?.(nextPersistedValue);
    } catch (error) {
      const message = error instanceof AdminCollectionTextSectionMutationError
        ? error.message
        : copy.fallbackErrorMessage;

      setFeedback({ kind: "error", message });
    }
  }

  function handleCancel(): void {
    setDraftValue(persistedValue ?? "");
    setFeedback({ kind: "idle" });
  }

  return (
    <AdminCollectionDetailSectionShell
      aside={<TextSectionStatusPill dirty={dirty} feedback={feedback} idlePill={copy.idlePill} locale={locale} />}
      description={description}
      eyebrow={eyebrow}
      title={title}
    >
      <div className="space-y-4">
        <label className="space-y-3" htmlFor={fieldId}>
          <span className="text-sm font-medium text-white/80">{copy.fieldLabel}</span>
          <textarea
            className="min-h-48 w-full rounded-3xl border border-white/12 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            id={fieldId}
            onChange={(event) => {
              setDraftValue(event.target.value);
              setFeedback({ kind: "idle" });
            }}
            placeholder={copy.placeholder}
            value={draftValue}
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TextSectionStatusMessage
            dirty={dirty}
            feedback={feedback}
            dirtyMessage={copy.dirtyMessage}
            idleMessage={localize(locale, {
              en: "No unsaved changes. Cover stays read-only while this section saves independently.",
              es: "No hay cambios pendientes. La caratula sigue read-only mientras esta seccion se guarda de forma independiente.",
              pt: "Nao ha alteracoes pendentes. A capa segue read-only enquanto esta secao salva de forma independente."
            })}
            savingMessage={copy.savingMessage}
            successMessage={copy.successMessage}
          />
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
              {feedback.kind === "saving" ? copy.savingLabel : copy.saveLabel}
            </button>
          </div>
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
