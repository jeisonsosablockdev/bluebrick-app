"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export const TOUR_STEP_IDS = {
  EDIT_BUTTON: "tour-anchor-edit-button",
  SAVE_CHANGES: "tour-anchor-edit-button",
  NAME_EMAIL: "tour-anchor-name-email",
  PHONE: "tour-anchor-phone",
  BIO: "tour-anchor-bio",
  ADDRESS: "tour-anchor-address",
  KYC: "tour-anchor-kyc",
} as const;

type TourStep = {
  id: number;
  anchorId?: string;
  icon: ReactNode;
  title: { en: string; es: string; pt: string };
  description: { en: string; es: string; pt: string };
  cta: { en: string; es: string; pt: string };
  isLast?: boolean;
};

type TourCardPosition = {
  top: number;
  left: number;
  width: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    anchorId: TOUR_STEP_IDS.EDIT_BUTTON,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: {
      en: "This is your profile",
      es: "Esta es la información de tu perfil",
      pt: "Esta é a informação do seu perfil",
    },
    description: {
      en: "Here you can manage all your personal data. Press '**Edit profile**' to start — you'll only need to do this once.",
      es: "Aquí puedes gestionar toda tu información personal. Presiona '**Editar perfil**' para comenzar — solo tendrás que hacerlo esta primera vez.",
      pt: "Aqui você pode gerenciar todos os seus dados pessoais. Pressione '**Editar perfil**' para começar — você só precisará fazer isso uma vez.",
    },
    cta: { en: "Got it, show me what to fill", es: "Entendido, muéstrame qué llenar", pt: "Entendido, mostre-me o que preencher" },
  },
  {
    id: 2,
    anchorId: TOUR_STEP_IDS.NAME_EMAIL,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: {
      en: "Your name and email",
      es: "Tu nombre y correo electrónico",
      pt: "Seu nome e e-mail",
    },
    description: {
      en: "Fill in your **first and last name**, and your email address. This helps us keep you informed and updated about your investments.",
      es: "Llena tus campos de **nombre y apellido**, y tu correo electrónico. Nos ayudará a tenerte actualizado sobre tus inversiones.",
      pt: "Preencha seus campos de **nome e sobrenome**, e seu e-mail. Isso nos ajuda a mantê-lo atualizado sobre seus investimentos.",
    },
    cta: { en: "Next: phone", es: "Siguiente: teléfono", pt: "Próximo: telefone" },
  },
  {
    id: 3,
    anchorId: TOUR_STEP_IDS.PHONE,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    title: {
      en: "Your contact phone",
      es: "Tu teléfono de contacto",
      pt: "Seu telefone de contato",
    },
    description: {
      en: "**Add a contact number and email** so we can share project updates and investment information with you. Your contact details are kept secure and private.",
      es: "**Agrega un número de contacto y email** para que podamos compartirte información sobre proyectos e inversiones. Tus datos de contacto se mantienen seguros y privados.",
      pt: "**Adicione um número de contato e e-mail** para que possamos compartilhar atualizações de projetos e informações de investimentos com você. Seus dados de contato são mantidos seguros e privados.",
    },
    cta: { en: "Next: your bio", es: "Siguiente: tu biografía", pt: "Próximo: sua bio" },
  },
  {
    id: 4,
    anchorId: TOUR_STEP_IDS.BIO,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: {
      en: "Tell us about yourself",
      es: "Cuéntanos quién eres",
      pt: "Conte-nos quem você é",
    },
    description: {
      en: "In your bio, **tell us a little about who you are**. We'd love to get to know you — what drives you to invest, your interests, or anything you'd like to share.",
      es: "En tu biografía, **cuéntanos un poco de quién eres**. Nos encantaría conocerte — qué te motiva a invertir, tus intereses, o lo que desees compartir.",
      pt: "Em sua bio, **conte-nos um pouco sobre quem você é**. Adoraríamos conhecê-lo — o que o motiva a investir, seus interesses ou o que desejar compartilhar.",
    },
    cta: { en: "Next: address", es: "Siguiente: dirección", pt: "Próximo: endereço" },
  },
  {
    id: 5,
    anchorId: TOUR_STEP_IDS.ADDRESS,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: {
      en: "Your address (optional)",
      es: "Tu dirección (opcional)",
      pt: "Seu endereço (opcional)",
    },
    description: {
      en: "Adding **your address** is optional, but it helps us find and show you real estate projects close to where you live. The more specific, the better the recommendations.",
      es: "Agregar **tu dirección** es opcional, pero nos ayudará a encontrar y mostrarte proyectos inmobiliarios cerca de donde vives. Entre más específica, mejores recomendaciones.",
      pt: "Adicionar **seu endereço** é opcional, mas nos ajudará a encontrar e mostrar projetos imobiliários perto de onde você mora. Quanto mais específico, melhores as recomendações.",
    },
    cta: { en: "Next: save your profile", es: "Siguiente: guarda tu perfil", pt: "Próximo: salve seu perfil" },
  },
  {
    id: 6,
    anchorId: TOUR_STEP_IDS.SAVE_CHANGES,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    title: {
      en: "Save your profile data",
      es: "Guarda los datos de tu perfil",
      pt: "Salve os dados do seu perfil",
    },
    description: {
      en: "To keep your profile information up to date, press **Save changes**.",
      es: "Para dejar tus datos de perfil actualizados presiona **Guardar cambios**.",
      pt: "Para manter seus dados de perfil atualizados, pressione **Salvar alterações**.",
    },
    cta: { en: "Last step: verify identity", es: "Último paso: verificar identidad", pt: "Último passo: verificar identidade" },
  },
  {
    id: 7,
    anchorId: TOUR_STEP_IDS.KYC,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: {
      en: "One last step — KYC verification",
      es: "¡Nos falta el último paso! — Verificación KYC",
      pt: "Falta apenas o último passo! — Verificação KYC",
    },
    description: {
      en: "To comply with investment regulations and unlock all platform features, please start your identity verification. If you can't finish it right now, don't worry — you can always come back and complete it later from this same section.",
      es: "Para cumplir con las regulaciones de inversión y desbloquear todas las funciones de la plataforma, por favor inicia tu verificación de identidad. Si no puedes terminarla ahora, no te preocupes — puedes volver en cualquier momento a completarla desde esta misma sección.",
      pt: "Para cumprir com os regulamentos de investimento e desbloquear todos os recursos da plataforma, por favor inicie sua verificação de identidade. Se não puder terminar agora, não se preocupe — você pode voltar a qualquer momento para completá-la nesta mesma seção.",
    },
    cta: { en: "Finish tour", es: "Finalizar tour", pt: "Finalizar tour" },
    isLast: true,
  },
];

const TOUR_DISMISSED_KEY = "bb_quick_tour_v2_dismissed";
const HORIZONTAL_MARGIN = 12;
const VERTICAL_GAP = 14;

function renderTourDescription(description: string) {
  return description
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((segment, index) => {
      const isEmphasis = segment.startsWith("**") && segment.endsWith("**");
      const text = isEmphasis ? segment.slice(2, -2) : segment;

      if (isEmphasis) {
        return (
          <strong key={`${text}-${index}`} className="font-semibold text-white">
            {text}
          </strong>
        );
      }

      return <Fragment key={`${text}-${index}`}>{text}</Fragment>;
    });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scrollToAnchor(anchorId: string) {
  setTimeout(() => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-highlight-pulse");
      setTimeout(() => el.classList.remove("tour-highlight-pulse"), 5400);
    }
  }, 110);
}

export function QuickTourOverlay() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isProfileRoute = pathname === "/profile" || pathname === "/profile/perfil" || pathname?.startsWith("/profile");

  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [cardPosition, setCardPosition] = useState<TourCardPosition>({
    top: 92,
    left: 16,
    width: 360,
  });

  const step = TOUR_STEPS[currentStep];

  const calculateCardPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = clamp(Math.min(360, viewportWidth - 24), 280, 360);
    const cardHeight = Math.max(210, cardRef.current?.offsetHeight ?? 230);

    if (!step?.anchorId || pathname !== "/profile/perfil") {
      setCardPosition({
        top: viewportWidth < 768 ? Math.max(72, viewportHeight - cardHeight - 16) : 88,
        left: clamp((viewportWidth - cardWidth) / 2, HORIZONTAL_MARGIN, viewportWidth - cardWidth - HORIZONTAL_MARGIN),
        width: cardWidth,
      });
      return;
    }

    const anchorEl = document.getElementById(step.anchorId);
    if (!anchorEl) {
      setCardPosition({
        top: viewportWidth < 768 ? Math.max(72, viewportHeight - cardHeight - 16) : 88,
        left: clamp((viewportWidth - cardWidth) / 2, HORIZONTAL_MARGIN, viewportWidth - cardWidth - HORIZONTAL_MARGIN),
        width: cardWidth,
      });
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const shouldPlaceBelow = spaceBelow >= cardHeight + VERTICAL_GAP || spaceBelow >= spaceAbove;

    const top = shouldPlaceBelow
      ? clamp(rect.bottom + VERTICAL_GAP, 16, viewportHeight - cardHeight - 16)
      : clamp(rect.top - cardHeight - VERTICAL_GAP, 16, viewportHeight - cardHeight - 16);

    const left = clamp(
      rect.left + rect.width / 2 - cardWidth / 2,
      HORIZONTAL_MARGIN,
      viewportWidth - cardWidth - HORIZONTAL_MARGIN,
    );

    setCardPosition({
      top,
      left,
      width: cardWidth,
    });
  }, [pathname, step?.anchorId]);

  useEffect(() => {
    if (!isProfileRoute) {
      setIsCheckingProfile(false);
      setShowTour(false);
      return;
    }

    const dismissed = sessionStorage.getItem(TOUR_DISMISSED_KEY);
    if (dismissed) {
      setIsCheckingProfile(false);
      return;
    }

    async function checkProfile() {
      try {
        const res = await fetch("/api/protected/profile", { cache: "no-store" });
        if (!res.ok) {
          return;
        }

        const payload = (await res.json()) as {
          data?: { firstName?: string | null; country?: string | null; email?: string | null };
        };

        if (payload.data) {
          const { firstName, country, email } = payload.data;
          if (!firstName || !country || !email) {
            setShowTour(true);
          }
        }
      } catch {
        // silently skip tour when profile cannot be checked
      } finally {
        setIsCheckingProfile(false);
      }
    }

    void checkProfile();
  }, [isProfileRoute]);

  useEffect(() => {
    if (!showTour || !isProfileRoute) {
      return;
    }

    if (step?.anchorId && pathname === "/profile/perfil") {
      scrollToAnchor(step.anchorId);
    }
  }, [isProfileRoute, pathname, showTour, step?.anchorId]);

  useEffect(() => {
    if (!showTour || !isProfileRoute) {
      return;
    }

    calculateCardPosition();
    const onViewportChange = () => calculateCardPosition();

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
    };
  }, [calculateCardPosition, currentStep, isProfileRoute, pathname, showTour]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(TOUR_DISMISSED_KEY, "true");
    setShowTour(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentStep((index) => Math.max(0, index - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (step?.isLast) {
      handleDismiss();
      return;
    }

    setCurrentStep((index) => Math.min(index + 1, TOUR_STEPS.length - 1));

    if (pathname !== "/profile/perfil") {
      router.push("/profile/perfil");
    }
  }, [handleDismiss, pathname, router, step?.isLast]);

  const progressPercent = useMemo(() => Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100), [currentStep]);

  if (!isProfileRoute || isCheckingProfile || !showTour) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.45); }
          50% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
        }
        .tour-highlight-pulse {
          animation: tourPulse 1.8s ease-out 3;
          border-radius: 0.9rem;
        }
      `}</style>

      <div className="quick-tour-backdrop" aria-hidden="true" />

      <section
        aria-live="polite"
        className="quick-tour-layer"
      >
        <div
          ref={cardRef}
          className="quick-tour-card marketplace-depth-card"
          style={{
            top: `${cardPosition.top}px`,
            left: `${cardPosition.left}px`,
            width: `${cardPosition.width}px`,
          }}
          role="dialog"
          aria-label={t({ en: "Quick onboarding tour", es: "Tour de onboarding", pt: "Tour de onboarding" })}
        >


          <div className="quick-tour-header">
            <div className="quick-tour-title-wrap">
              <span className="quick-tour-icon" aria-hidden="true">{step.icon}</span>
              <p className="quick-tour-title">{t(step.title)}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="quick-tour-close"
              aria-label={t({ en: "Skip tour", es: "Saltar tour", pt: "Pular tour" })}
            >
              ✕
            </button>
          </div>

          <p className="quick-tour-description">{renderTourDescription(t(step.description))}</p>

          <div className="quick-tour-footer">
            <div className="quick-tour-progress-group">
              <div className="quick-tour-dots" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                {TOUR_STEPS.map((tourStep, index) => (
                  <span
                    key={tourStep.id}
                    className={`quick-tour-dot ${index <= currentStep ? "quick-tour-dot-active" : ""}`}
                  />
                ))}
              </div>
              <span className="quick-tour-count">{currentStep + 1}/{TOUR_STEPS.length}</span>
            </div>

            <div className="quick-tour-actions">
              <Button
                variant="ghost"
                className="quick-tour-prev-btn"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                {t({ en: "Back", es: "Atrás", pt: "Voltar" })}
              </Button>

              {pathname !== "/profile/perfil" && currentStep === 0 ? (
                <Button
                  className="quick-tour-pill"
                  onClick={() => {
                    router.push("/profile/perfil");
                    setCurrentStep(0);
                  }}
                >
                  {t({ en: "Go to profile", es: "Ir a mi perfil", pt: "Ir ao perfil" })} →
                </Button>
              ) : (
                <Button className="quick-tour-pill" onClick={handleNext}>
                  {t(step.cta)} →
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
