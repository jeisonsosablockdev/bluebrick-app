"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import { AdminCollectionDetailSectionShell } from "@/components/admin/admin-collection-detail-section-primitives";
import {
  AdminCollectionSummaryMutationError,
  isAdminCollectionSummaryDirty,
  updateAdminCollectionSummary
} from "@/lib/admin/admin-collection-summary-client";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionSummaryEditorProps = {
  entryId: string;
  locale: AppLocale;
  initialValue: string | null;
};

type SummaryEditorFeedbackState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function SummaryEditorStatusPill({
  locale,
  dirty,
  feedback
}: {
  locale: AppLocale;
  dirty: boolean;
  feedback: SummaryEditorFeedbackState;
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
      {localize(locale, { en: "Summary editor", es: "Editor de resumen", pt: "Editor de resumo" })}
    </span>
  );
}

function SummaryEditorStatusMessage({
  locale,
  dirty,
  feedback
}: {
  locale: AppLocale;
  dirty: boolean;
  feedback: SummaryEditorFeedbackState;
}): ReactElement {
  let message = localize(locale, {
    en: "No unsaved changes. Cover stays read-only while this summary saves independently.",
    es: "No hay cambios pendientes. La caratula sigue read-only mientras este resumen se guarda de forma independiente.",
    pt: "Nao ha alteracoes pendentes. A capa segue read-only enquanto este resumo salva de forma independente."
  });
  let toneClass = "text-white/55";

  if (dirty) {
    message = localize(locale, {
      en: "Summary changes are local until you press Save summary.",
      es: "Los cambios del resumen son locales hasta que presiones Save summary.",
      pt: "As alteracoes do resumo permanecem locais ate voce pressionar Save summary."
    });
    toneClass = "text-amber-100";
  }

  if (feedback.kind === "saving") {
    message = localize(locale, {
      en: "Saving the summary section only. Other sections remain untouched.",
      es: "Guardando solo la seccion de resumen. Las otras secciones no cambian.",
      pt: "Salvando apenas a secao de resumo. As outras secoes permanecem intactas."
    });
    toneClass = "text-sky-100";
  } else if (feedback.kind === "success") {
    message = localize(locale, {
      en: "Summary saved. The latest persisted value is already reflected below.",
      es: "Resumen guardado. El ultimo valor persistido ya se refleja abajo.",
      pt: "Resumo salvo. O valor persistido mais recente ja aparece abaixo."
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

export function AdminCollectionSummaryEditor({
  entryId,
  locale,
  initialValue
}: AdminCollectionSummaryEditorProps): ReactElement {
  const [persistedValue, setPersistedValue] = useState<string | null>(initialValue);
  const [draftValue, setDraftValue] = useState(initialValue ?? "");
  const [feedback, setFeedback] = useState<SummaryEditorFeedbackState>({ kind: "idle" });

  const dirty = isAdminCollectionSummaryDirty({
    persistedValue,
    draftValue
  });

  async function handleSave(): Promise<void> {
    if (!dirty || feedback.kind === "saving") {
      return;
    }

    setFeedback({ kind: "saving" });

    try {
      const updatedContent = await updateAdminCollectionSummary({
        entryId,
        summary: draftValue
      });
      const nextPersistedValue = updatedContent.fractionalInvestmentSummary;

      setPersistedValue(nextPersistedValue);
      setDraftValue(nextPersistedValue ?? "");
      setFeedback({ kind: "success" });
    } catch (error) {
      const message = error instanceof AdminCollectionSummaryMutationError
        ? error.message
        : localize(locale, {
            en: "Could not save the summary section.",
            es: "No se pudo guardar la seccion de resumen.",
            pt: "Nao foi possivel salvar a secao de resumo."
          });

      setFeedback({ kind: "error", message });
    }
  }

  function handleCancel(): void {
    setDraftValue(persistedValue ?? "");
    setFeedback({ kind: "idle" });
  }

  return (
    <AdminCollectionDetailSectionShell
      aside={<SummaryEditorStatusPill dirty={dirty} feedback={feedback} locale={locale} />}
      description={localize(locale, {
        en: "Commercial narrative now owns its own edit loop so the admin can save or discard summary changes without reopening the rest of the detail page.",
        es: "La narrativa comercial ahora tiene su propio loop de edicion para que el admin pueda guardar o descartar cambios del resumen sin reabrir el resto de la pagina.",
        pt: "A narrativa comercial agora tem seu proprio loop de edicao para que o admin possa salvar ou descartar alteracoes do resumo sem reabrir o restante da pagina."
      })}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      title={localize(locale, { en: "Fractional investment summary", es: "Fractional investment summary", pt: "Fractional investment summary" })}
    >
      <div className="space-y-4">
        <label className="space-y-3" htmlFor="collection-summary-editor">
          <span className="text-sm font-medium text-white/80">
            {localize(locale, { en: "Summary narrative", es: "Narrativa del resumen", pt: "Narrativa do resumo" })}
          </span>
          <textarea
            className="min-h-48 w-full rounded-3xl border border-white/12 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            id="collection-summary-editor"
            onChange={(event) => {
              setDraftValue(event.target.value);
              setFeedback({ kind: "idle" });
            }}
            placeholder={localize(locale, {
              en: "Describe the commercial thesis, yield profile, and investor-facing highlights for this collection.",
              es: "Describe la tesis comercial, el perfil de yield y los highlights para inversionistas de esta coleccion.",
              pt: "Descreva a tese comercial, o perfil de yield e os destaques para investidores desta colecao."
            })}
            value={draftValue}
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SummaryEditorStatusMessage dirty={dirty} feedback={feedback} locale={locale} />
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
                ? localize(locale, { en: "Saving summary", es: "Guardando resumen", pt: "Salvando resumo" })
                : localize(locale, { en: "Save summary", es: "Save summary", pt: "Save summary" })}
            </button>
          </div>
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
