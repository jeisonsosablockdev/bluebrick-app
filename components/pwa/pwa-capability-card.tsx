"use client";

import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePwaCapabilityState } from "@/components/pwa/use-pwa-capability-state";
import { useWebPushEnrollment } from "@/components/pwa/use-web-push-enrollment";
import type { PwaInstallabilityState, PwaNotificationState, PwaPlatform } from "@/lib/pwa/capabilities";

type PwaCapabilityCardProps = {
  audience: "account-linking" | "wallet-profile";
};

type LocalizedLabel = {
  en: string;
  es: string;
  pt: string;
};

function installabilityBadgeClass(state: PwaInstallabilityState): string {
  if (state === "standalone") {
    return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100";
  }

  if (state === "prompt-ready") {
    return "border-cyan-400/30 bg-cyan-500/12 text-cyan-100";
  }

  if (state === "manual-ios" || state === "criteria-pending") {
    return "border-amber-400/30 bg-amber-500/12 text-amber-100";
  }

  return "border-white/12 bg-white/6 text-white/68";
}

function notificationBadgeClass(state: PwaNotificationState): string {
  if (state === "ready") {
    return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100";
  }

  if (state === "needs-install") {
    return "border-amber-400/30 bg-amber-500/12 text-amber-100";
  }

  if (state === "blocked") {
    return "border-rose-400/30 bg-rose-500/12 text-rose-100";
  }

  return "border-white/12 bg-white/6 text-white/68";
}

function resolveInstallabilityLabel(state: PwaInstallabilityState): LocalizedLabel {
  if (state === "standalone") {
    return {
      en: "App shell active",
      es: "Shell app activa",
      pt: "Shell do app ativa"
    };
  }

  if (state === "prompt-ready") {
    return {
      en: "Install prompt ready",
      es: "Prompt de instalacion listo",
      pt: "Prompt de instalacao pronto"
    };
  }

  if (state === "manual-ios") {
    return {
      en: "Home Screen install required",
      es: "Requiere instalar en Home Screen",
      pt: "Exige instalar na Home Screen"
    };
  }

  if (state === "criteria-pending") {
    return {
      en: "Install criteria still warming up",
      es: "Los criterios de instalacion aun se estan activando",
      pt: "Os criterios de instalacao ainda estao aquecendo"
    };
  }

  return {
    en: "Install shell unavailable",
    es: "Shell instalable no disponible",
    pt: "Shell instalavel indisponivel"
  };
}

function resolveNotificationLabel(state: PwaNotificationState): LocalizedLabel {
  if (state === "ready") {
    return {
      en: "Push-capable browser",
      es: "Navegador apto para push",
      pt: "Navegador apto para push"
    };
  }

  if (state === "needs-install") {
    return {
      en: "Install required before push",
      es: "Instalacion requerida antes de push",
      pt: "Instalacao necessaria antes do push"
    };
  }

  if (state === "blocked") {
    return {
      en: "Notifications blocked by browser",
      es: "Notificaciones bloqueadas por el navegador",
      pt: "Notificacoes bloqueadas pelo navegador"
    };
  }

  return {
    en: "Push unsupported here",
    es: "Push no soportado aqui",
    pt: "Push nao suportado aqui"
  };
}

function resolveTitle(
  audience: PwaCapabilityCardProps["audience"],
  installabilityState: PwaInstallabilityState,
  platform: PwaPlatform
): LocalizedLabel {
  if (installabilityState === "standalone") {
    return audience === "account-linking"
      ? {
        en: "This device already has the BRIDS app shell",
        es: "Este dispositivo ya tiene el shell app de BRIDS",
        pt: "Este dispositivo ja tem o shell app da BRIDS"
      }
      : {
        en: "This wallet profile is already running inside the BRIDS app shell",
        es: "Este perfil wallet ya corre dentro del shell app de BRIDS",
        pt: "Este perfil wallet ja roda dentro do shell app da BRIDS"
      };
  }

  if (installabilityState === "prompt-ready") {
    return {
      en: "Install BRIDS from this browser",
      es: "Instala BRIDS desde este navegador",
      pt: "Instale a BRIDS neste navegador"
    };
  }

  if (installabilityState === "manual-ios") {
    return {
      en: "iPhone and iPad need a Home Screen install first",
      es: "iPhone y iPad necesitan instalar primero en Home Screen",
      pt: "iPhone e iPad precisam instalar primeiro na Home Screen"
    };
  }

  if (installabilityState === "criteria-pending") {
    return {
      en: `BRIDS is exposing its install shell on ${platform === "desktop" ? "desktop" : "this browser"}`,
      es: `BRIDS ya expone su shell instalable en ${platform === "desktop" ? "desktop" : "este navegador"}`,
      pt: `A BRIDS ja expoe seu shell instalavel em ${platform === "desktop" ? "desktop" : "este navegador"}`
    };
  }

  return {
    en: "This browser is missing part of the install foundation",
    es: "A este navegador le falta parte de la base instalable",
    pt: "Este navegador nao tem toda a base instalavel"
  };
}

function resolveBody(
  audience: PwaCapabilityCardProps["audience"],
  installabilityState: PwaInstallabilityState,
  notificationState: PwaNotificationState
): LocalizedLabel {
  if (installabilityState === "standalone") {
    return audience === "account-linking"
      ? {
        en: "Keep linking your wallet from this same account. The app shell is already in place, so later notification enrollment can bind to this install instead of a random browser tab.",
        es: "Sigue vinculando tu wallet desde esta misma cuenta. El shell app ya esta listo, asi que el alta de notificaciones podra atarse a esta instalacion y no a una pestana aleatoria.",
        pt: "Continue vinculando sua wallet nesta mesma conta. O shell app ja esta pronto, entao a ativacao posterior de notificacoes podera se ligar a esta instalacao em vez de uma aba aleatoria."
      }
      : {
        en: "This device is already using the standalone shell. Notification enrollment can be added later without introducing tab-only UX or Safari chrome dependency.",
        es: "Este dispositivo ya usa el shell standalone. El alta de notificaciones podra anadirse despues sin depender de UX de pestana ni de las barras de Safari.",
        pt: "Este dispositivo ja usa o shell standalone. A ativacao de notificacoes podera ser adicionada depois sem depender de UX de aba nem das barras do Safari."
      };
  }

  if (installabilityState === "prompt-ready") {
    return {
      en: "Installability is now live on this browser. Use the install prompt to move BRIDS out of tab chrome before later slices add subscription and delivery logic.",
      es: "La instalabilidad ya esta activa en este navegador. Usa el prompt de instalacion para sacar BRIDS del chrome de pestana antes de que los siguientes slices agreguen suscripcion y delivery.",
      pt: "A instalabilidade ja esta ativa neste navegador. Use o prompt de instalacao para tirar a BRIDS do chrome da aba antes que os proximos slices adicionem inscricao e entrega."
    };
  }

  if (installabilityState === "manual-ios") {
    return {
      en: "Safari on iOS keeps push locked behind Home Screen web apps. Add BRIDS to Home Screen first; later notification enrollment should only happen from that installed shell.",
      es: "Safari en iOS mantiene push bloqueado detras de las web apps instaladas en Home Screen. Agrega BRIDS a Home Screen primero; el alta posterior de notificaciones debe ocurrir solo desde ese shell instalado.",
      pt: "O Safari no iOS mantem o push bloqueado atras de web apps instalados na Home Screen. Adicione a BRIDS na Home Screen primeiro; a ativacao posterior de notificacoes deve acontecer apenas desse shell instalado."
    };
  }

  if (installabilityState === "criteria-pending") {
    return {
      en: "The manifest and service worker are already present, but this browser has not surfaced the install prompt yet. Keep using BRIDS here and re-check once the browser decides the prompt is eligible.",
      es: "El manifest y el service worker ya existen, pero este navegador aun no muestra el prompt de instalacion. Sigue usando BRIDS aqui y vuelve a revisar cuando el navegador decida que el prompt ya es elegible.",
      pt: "O manifest e o service worker ja existem, mas este navegador ainda nao mostrou o prompt de instalacao. Continue usando a BRIDS aqui e verifique de novo quando o navegador decidir que o prompt ja esta elegivel."
    };
  }

  if (notificationState === "blocked") {
    return {
      en: "This browser currently blocks notifications. Re-enable them in browser settings before later enrollment steps can succeed.",
      es: "Este navegador tiene las notificaciones bloqueadas. Reactivalas en la configuracion del navegador antes de que los siguientes pasos de alta puedan funcionar.",
      pt: "Este navegador esta bloqueando notificacoes. Reative-as nas configuracoes do navegador antes que os proximos passos de ativacao possam funcionar."
    };
  }

  return {
    en: "Switch to a current Safari, Chrome, or Edge build before expecting a reliable install shell or push-ready path from this device.",
    es: "Cambia a una version actual de Safari, Chrome o Edge antes de esperar un shell instalable o una ruta push confiable desde este dispositivo.",
    pt: "Mude para uma versao atual do Safari, Chrome ou Edge antes de esperar um shell instalavel ou um caminho push confiavel neste dispositivo."
  };
}

export function PwaCapabilityCard({ audience }: PwaCapabilityCardProps): ReactElement {
  const { t } = useI18n();
  const { installPromptOutcome, isPromptingInstall, promptInstall, snapshot } = usePwaCapabilityState();
  const {
    canDisable,
    canEnable,
    disableNotifications,
    enableNotifications,
    errorMessage,
    hasCurrentSubscription,
    isLoading,
    statusMessage,
    subscriptionCount
  } = useWebPushEnrollment({
    audience,
    snapshot,
    t
  });

  const installabilityLabel = resolveInstallabilityLabel(snapshot.installabilityState);
  const notificationLabel = resolveNotificationLabel(snapshot.notificationState);
  const title = resolveTitle(audience, snapshot.installabilityState, snapshot.platform);
  const body = resolveBody(audience, snapshot.installabilityState, snapshot.notificationState);
  const nextActionLabel =
    canEnable
      ? t({ en: "Enable notifications", es: "Activar notificaciones", pt: "Ativar notificacoes" })
      : canDisable
        ? t({ en: "Disable notifications", es: "Desactivar notificaciones", pt: "Desativar notificacoes" })
        : snapshot.installabilityState !== "standalone"
          ? t({ en: "Add to Home Screen", es: "Anadir a pantalla de inicio", pt: "Adicionar a Tela de Inicio" })
          : null;

  return (
    <Card className="overflow-hidden border-white/12 bg-[linear-gradient(160deg,rgba(8,18,31,0.94),rgba(5,12,23,0.98))] p-0 shadow-[0_18px_50px_rgba(3,8,18,0.34)]">
      <div className="border-b border-white/10 px-4 pb-3 pt-4 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/88">
          {t({ en: "Installability / Push readiness", es: "Instalabilidad / Preparacion push", pt: "Instalabilidade / Preparacao push" })}
        </p>
        <h3 className="mt-2 max-w-[24ch] text-lg font-semibold leading-tight text-white">{t(title)}</h3>
        <p className="mt-3 text-sm leading-7 text-white/78">{t(body)}</p>
        {nextActionLabel ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-cyan-200/88">
            {nextActionLabel}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/22 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {t({ en: "Install shell", es: "Shell instalable", pt: "Shell instalavel" })}
          </p>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${installabilityBadgeClass(snapshot.installabilityState)}`}>
            {t(installabilityLabel)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/22 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {t({ en: "Notification lane", es: "Canal de notificaciones", pt: "Canal de notificacoes" })}
          </p>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${notificationBadgeClass(snapshot.notificationState)}`}>
            {t(notificationLabel)}
          </div>
        </div>
      </div>

      {snapshot.installabilityState === "manual-ios" ? (
        <div className="border-t border-white/10 px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            {t({ en: "What to do on iOS", es: "Que hacer en iOS", pt: "O que fazer no iOS" })}
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-white/78">
            <li>{t({ en: "1. Open the Share sheet in Safari.", es: "1. Abre el menu Compartir en Safari.", pt: "1. Abra o menu Compartilhar no Safari." })}</li>
            <li>{t({ en: "2. Choose Add to Home Screen.", es: "2. Elige Anadir a pantalla de inicio.", pt: "2. Escolha Adicionar a Tela de Inicio." })}</li>
            <li>{t({ en: "3. Re-open BRIDS from the new icon before expecting push eligibility.", es: "3. Reabre BRIDS desde el nuevo icono antes de esperar elegibilidad push.", pt: "3. Reabra a BRIDS pelo novo icone antes de esperar elegibilidade para push." })}</li>
          </ol>
        </div>
      ) : null}

      {snapshot.installabilityState === "prompt-ready" ? (
        <div className="border-t border-white/10 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="min-h-11 sm:w-auto"
              disabled={isPromptingInstall}
              onClick={() => {
                void promptInstall();
              }}
              type="button"
            >
              {isPromptingInstall
                ? t({ en: "Opening install prompt...", es: "Abriendo prompt de instalacion...", pt: "Abrindo prompt de instalacao..." })
                : t({ en: "Install BRIDS", es: "Instalar BRIDS", pt: "Instalar BRIDS" })}
            </Button>
            <p className="text-sm leading-6 text-white/65">
              {t({
                en: "Install first, then come back here to enroll notifications from the installed shell. If needed, use your browser menu to Add to Home Screen.",
                es: "Instala primero y luego vuelve aqui para inscribir notificaciones desde el shell instalado. Si hace falta, usa el menu del navegador para Anadir a pantalla de inicio.",
                pt: "Instale primeiro e depois volte aqui para inscrever notificacoes a partir do shell instalado. Se precisar, use o menu do navegador para Adicionar a Tela de Inicio."
              })}
            </p>
          </div>
        </div>
      ) : null}

      {snapshot.notificationState === "ready" ? (
        <div className="border-t border-white/10 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                {t({ en: "Notification enrollment", es: "Alta de notificaciones", pt: "Ativacao de notificacoes" })}
              </p>
              <p className="text-sm leading-6 text-white/72">
                {audience === "wallet-profile"
                  ? hasCurrentSubscription
                    ? t({
                        en: "This device is already subscribed. Admin notices and transactional pushes can target this install.",
                        es: "Este dispositivo ya esta suscrito. Los avisos admin y los pushes transaccionales ya pueden apuntar a esta instalacion.",
                        pt: "Este dispositivo ja esta inscrito. Avisos admin e pushes transacionais ja podem apontar para esta instalacao."
                      })
                    : t({
                        en: "Install alone is not enough. Use a direct tap here to grant permission and register this device for BRIDS push.",
                        es: "Instalar no basta. Usa un toque directo aqui para conceder permiso y registrar este dispositivo para push de BRIDS.",
                        pt: "Instalar nao basta. Use um toque direto aqui para conceder permissao e registrar este dispositivo para push da BRIDS."
                      })
                  : t({
                      en: "Wallet step-up is still required before this account can own a push subscription.",
                      es: "Todavia hace falta wallet step-up antes de que esta cuenta pueda ser duena de una suscripcion push.",
                      pt: "Ainda falta wallet step-up antes que esta conta possa possuir uma inscricao push."
                    })}
              </p>
              {subscriptionCount > 0 ? (
                <p className="text-xs text-white/55">
                  {t({
                    en: `${subscriptionCount} active subscription${subscriptionCount === 1 ? "" : "s"} linked to this wallet.`,
                    es: `${subscriptionCount} suscripcion${subscriptionCount === 1 ? "" : "es"} activa${subscriptionCount === 1 ? "" : "s"} ligada${subscriptionCount === 1 ? "" : "s"} a esta wallet.`,
                    pt: `${subscriptionCount} inscricao${subscriptionCount === 1 ? "" : "es"} ativa${subscriptionCount === 1 ? "" : "s"} ligada${subscriptionCount === 1 ? "" : "s"} a esta wallet.`
                  })}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {canEnable ? (
                <Button className="min-h-11 sm:w-auto" disabled={isLoading} onClick={() => void enableNotifications()} type="button">
                  {isLoading
                    ? t({ en: "Activating...", es: "Activando...", pt: "Ativando..." })
                    : t({ en: "Enable notifications", es: "Activar notificaciones", pt: "Ativar notificacoes" })}
                </Button>
              ) : null}

              {canDisable ? (
                <Button
                  className="min-h-11 border border-white/12 bg-white/[0.04] text-white/90 hover:bg-white/[0.1] sm:w-auto"
                  disabled={isLoading}
                  onClick={() => void disableNotifications()}
                  type="button"
                  variant="ghost"
                >
                  {isLoading
                    ? t({ en: "Updating...", es: "Actualizando...", pt: "Atualizando..." })
                    : t({ en: "Disable notifications", es: "Desactivar notificaciones", pt: "Desativar notificacoes" })}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {installPromptOutcome === "dismissed" ? (
        <div className="border-t border-amber-400/18 bg-amber-500/8 px-4 py-3 sm:px-5">
          <p className="text-sm text-amber-100">
            {t({
              en: "Install prompt dismissed. BRIDS stays usable in-browser, but the native shell benefits remain off until you accept installation.",
              es: "Prompt de instalacion descartado. BRIDS sigue usable en navegador, pero los beneficios del shell nativo quedan apagados hasta aceptar la instalacion.",
              pt: "Prompt de instalacao dispensado. A BRIDS continua usavel no navegador, mas os beneficios do shell nativo ficam desligados ate aceitar a instalacao."
            })}
          </p>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="border-t border-emerald-400/18 bg-emerald-500/8 px-4 py-3 sm:px-5">
          <p className="text-sm text-emerald-100">{statusMessage}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="border-t border-rose-400/18 bg-rose-500/8 px-4 py-3 sm:px-5">
          <p className="text-sm text-rose-100">{errorMessage}</p>
        </div>
      ) : null}
    </Card>
  );
}
