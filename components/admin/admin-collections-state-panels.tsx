import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { localize, type AppLocale } from "@/lib/i18n";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

function StateActionLink({
  href,
  label,
  variant = "primary"
}: {
  href: string;
  label: string;
  variant?: "primary" | "outline";
}): ReactElement {
  const variantClass =
    variant === "primary"
      ? "bg-gradientPrimary text-white shadow-glow hover:opacity-95"
      : "border border-white/25 text-white hover:bg-white/10";

  return (
    <a
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all sm:w-auto ${variantClass}`}
      href={href}
    >
      {label}
    </a>
  );
}

function CollectionsStatePanel({
  eyebrow,
  title,
  description,
  tone,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: "empty" | "error";
  children: ReactElement;
}): ReactElement {
  const orbClass =
    tone === "error"
      ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
      : "border-sky-300/30 bg-sky-400/10 text-sky-100";

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-48 border-b border-white/10 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.18),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 md:border-b-0 md:border-r">
          <div className="absolute inset-x-5 bottom-5 top-5 rounded-[2rem] border border-white/10 bg-black/10" />
          <div className={`relative flex h-full min-h-36 items-center justify-center rounded-[2rem] border text-center ${orbClass}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">{eyebrow}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{tone === "error" ? "!" : "0"}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{eyebrow}</p>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="max-w-2xl text-sm leading-6 text-white/70">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

export function AdminCollectionsErrorState({
  locale,
  message
}: {
  locale: AppLocale;
  message: string;
}): ReactElement {
  return (
    <div aria-live="assertive">
      <CollectionsStatePanel
        description={localize(locale, {
          en: "The server-side collection contract did not return a usable response. No client state is trusted here, so retry after the admin session or API is healthy.",
          es: "El contrato server-side de colecciones no devolvio una respuesta usable. Aqui no se confia en estado del cliente, asi que reintenta cuando la sesion admin o la API esten saludables.",
          pt: "O contrato server-side de colecoes nao retornou uma resposta utilizavel. Nenhum estado do cliente e confiado aqui, entao tente novamente quando a sessao admin ou a API estiverem saudaveis."
        })}
        eyebrow={localize(locale, { en: "Degraded state", es: "Estado degradado", pt: "Estado degradado" })}
        title={localize(locale, {
          en: "Collections workspace unavailable",
          es: "Workspace de colecciones no disponible",
          pt: "Workspace de colecoes indisponivel"
        })}
        tone="error"
      >
        <div className="space-y-4">
          <p className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            {message}
          </p>
          <StateActionLink
            href="/admin/collections"
            label={localize(locale, { en: "Retry loading", es: "Reintentar carga", pt: "Tentar novamente" })}
            variant="outline"
          />
        </div>
      </CollectionsStatePanel>
    </div>
  );
}

export function AdminCollectionsEmptyState({
  locale
}: {
  locale: AppLocale;
}): ReactElement {
  const showMintLink = isReleaseControlledRouteVisible("/admin/mint");

  return (
    <div aria-live="polite">
      <CollectionsStatePanel
        description={localize(locale, {
          en: "Deploy or link a collection before this workspace can expose editable content. Once a collection is owned and indexed, it will appear here with its snapshot and edit readiness.",
          es: "Despliega o vincula una coleccion antes de que este workspace pueda exponer contenido editable. Cuando una coleccion este owned e indexada, aparecera aqui con su snapshot y readiness de edicion.",
          pt: "Implante ou vincule uma colecao antes que este workspace exponha conteudo editavel. Quando uma colecao estiver owned e indexada, aparecera aqui com seu snapshot e readiness de edicao."
        })}
        eyebrow={localize(locale, { en: "Empty state", es: "Estado vacio", pt: "Estado vazio" })}
        title={localize(locale, {
          en: "No owned collections found",
          es: "No se encontraron colecciones propias",
          pt: "Nenhuma colecao propria encontrada"
        })}
        tone="empty"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <StateActionLink
            href="/admin/assets/new"
            label={localize(locale, { en: "Start a collection", es: "Crear coleccion", pt: "Criar colecao" })}
          />
          {showMintLink ? (
            <StateActionLink
              href="/admin/mint"
              label={localize(locale, { en: "Review mint tools", es: "Revisar herramientas mint", pt: "Revisar ferramentas mint" })}
              variant="outline"
            />
          ) : null}
        </div>
      </CollectionsStatePanel>
    </div>
  );
}
