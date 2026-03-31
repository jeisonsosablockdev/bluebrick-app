"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

// Tour step IDs — these match anchor IDs we add to the profile module
export const TOUR_STEP_IDS = {
  EDIT_BUTTON: "tour-anchor-edit-button",
  NAME_EMAIL: "tour-anchor-name-email",
  PHONE: "tour-anchor-phone",
  BIO: "tour-anchor-bio",
  ADDRESS: "tour-anchor-address",
  KYC: "tour-anchor-kyc",
} as const;

type TourStep = {
  id: number;
  anchorId?: string;
  icon: string;
  title: { en: string; es: string; pt: string };
  description: { en: string; es: string; pt: string };
  cta: { en: string; es: string; pt: string };
  isLast?: boolean;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    anchorId: TOUR_STEP_IDS.EDIT_BUTTON,
    icon: "👋",
    title: {
      en: "This is your profile",
      es: "Esta es la información de tu perfil",
      pt: "Esta é a informação do seu perfil",
    },
    description: {
      en: "Here you can manage all your personal data. Press 'Edit profile' to start — you'll only need to do this once.",
      es: "Aquí puedes gestionar toda tu información personal. Presiona 'Editar perfil' para comenzar — solo tendrás que hacerlo esta primera vez.",
      pt: "Aqui você pode gerenciar todos os seus dados pessoais. Pressione 'Editar perfil' para comenzar — você só precisará fazer isso uma vez.",
    },
    cta: { en: "Got it, show me what to fill →", es: "Entendido, muéstrame qué llenar →", pt: "Entendido, mostre-me o que preencher →" },
  },
  {
    id: 2,
    anchorId: TOUR_STEP_IDS.NAME_EMAIL,
    icon: "✍️",
    title: {
      en: "Your name and email",
      es: "Tu nombre y correo electrónico",
      pt: "Seu nome e e-mail",
    },
    description: {
      en: "Fill in your first and last name, and your email address. This helps us keep you informed and updated about your investments.",
      es: "Llena tus campos de nombre y apellido, y tu correo electrónico. Nos ayudará a tenerte actualizado sobre tus inversiones.",
      pt: "Preencha seus campos de nome e sobrenome, e seu e-mail. Isso nos ajuda a mantê-lo atualizado sobre seus investimentos.",
    },
    cta: { en: "Next: phone →", es: "Siguiente: teléfono →", pt: "Próximo: telefone →" },
  },
  {
    id: 3,
    anchorId: TOUR_STEP_IDS.PHONE,
    icon: "📱",
    title: {
      en: "Your contact phone",
      es: "Tu teléfono de contacto",
      pt: "Seu telefone de contato",
    },
    description: {
      en: "Add a contact number where you'd like to receive project updates and investment information. Your number is kept secure and private.",
      es: "Agrega un número de contacto en el cual deseas recibir información sobre proyectos e inversiones. Tu número se mantiene seguro y privado.",
      pt: "Adicione um número de contato para receber atualizações de projetos e informações de investimentos. Seu número é mantido seguro e privado.",
    },
    cta: { en: "Next: your bio →", es: "Siguiente: tu biografía →", pt: "Próximo: sua bio →" },
  },
  {
    id: 4,
    anchorId: TOUR_STEP_IDS.BIO,
    icon: "🌟",
    title: {
      en: "Tell us about yourself",
      es: "Cuéntanos quién eres",
      pt: "Conte-nos quem você é",
    },
    description: {
      en: "In your bio, tell us a little about who you are. We'd love to get to know you — what drives you to invest, your interests, or anything you'd like to share.",
      es: "En tu biografía, cuéntanos un poco de quién eres. Nos encantaría conocerte — qué te motiva a invertir, tus intereses, o lo que desees compartir.",
      pt: "Em sua bio, conte-nos um pouco sobre quem você é. Adoraríamos conhecê-lo — o que o motiva a investir, seus interesses ou o que desejar compartilhar.",
    },
    cta: { en: "Next: address →", es: "Siguiente: dirección →", pt: "Próximo: endereço →" },
  },
  {
    id: 5,
    anchorId: TOUR_STEP_IDS.ADDRESS,
    icon: "📍",
    title: {
      en: "Your address (optional)",
      es: "Tu dirección (opcional)",
      pt: "Seu endereço (opcional)",
    },
    description: {
      en: "Adding your address is optional, but it helps us find and show you real estate projects close to where you live. The more specific, the better the recommendations.",
      es: "Agregar tu dirección es opcional, pero nos ayudará a encontrar y mostrarte proyectos inmobiliarios cerca de donde vives. Entre más específica, mejores recomendaciones.",
      pt: "Adicionar seu endereço é opcional, mas nos ajudará a encontrar e mostrar projetos imobiliários perto de onde você mora. Quanto mais específico, melhores as recomendações.",
    },
    cta: { en: "Last step: verify identity →", es: "Último paso: verificar identidad →", pt: "Último passo: verificar identidade →" },
  },
  {
    id: 6,
    anchorId: TOUR_STEP_IDS.KYC,
    icon: "🔐",
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
    cta: { en: "Finish tour 🎉", es: "Finalizar tour 🎉", pt: "Finalizar tour 🎉" },
    isLast: true,
  },
];

const TOUR_DISMISSED_KEY = "bb_quick_tour_v2_dismissed";

function scrollToAnchor(anchorId: string) {
  // Small delay to let the DOM settle before scrolling
  setTimeout(() => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight pulse animation
      el.classList.add("tour-highlight-pulse");
      setTimeout(() => el.classList.remove("tour-highlight-pulse"), 2000);
    }
  }, 150);
}

export function QuickTourOverlay() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(TOUR_DISMISSED_KEY);
    if (dismissed) {
      setIsCheckingProfile(false);
      return;
    }

    async function checkProfile() {
      try {
        const res = await fetch("/api/protected/profile");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload.data) {
          const { firstName, country, email } = payload.data;
          if (!firstName || !country || !email) {
            setShowTour(true);
          }
        }
      } catch {
        // silently skip tour if we can't check
      } finally {
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, []);

  // When a step has an anchor, scroll to it
  useEffect(() => {
    if (!showTour) return;
    const step = TOUR_STEPS[currentStep];
    if (step?.anchorId && pathname === "/protected/perfil") {
      scrollToAnchor(step.anchorId);
    }
  }, [currentStep, showTour, pathname]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(TOUR_DISMISSED_KEY, "true");
    setShowTour(false);
  }, []);

  const handleNext = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (step?.isLast) {
      handleDismiss();
      return;
    }

    const nextIndex = currentStep + 1;
    setCurrentStep(nextIndex);

    // If we're not yet on the profile page, navigate there on step 2+
    if (pathname !== "/protected/perfil") {
      router.push("/protected/perfil");
    }
  }, [currentStep, handleDismiss, pathname, router]);

  if (isCheckingProfile || !showTour) return null;

  const step = TOUR_STEPS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100);

  return (
    <>
      {/* Global styles for the tour highlight pulse effect */}
      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(34, 211, 238, 0.6); }
          50% { box-shadow: 0 0 0 8px rgba(34, 211, 238, 0); }
        }
        .tour-highlight-pulse {
          animation: tourPulse 1.5s ease-out 2;
          border-radius: 0.75rem;
        }
      `}</style>

      {/* Fixed top banner — visible on all protected pages */}
      <div className="fixed left-0 right-0 top-0 z-[200] pointer-events-none">
        <div
          className="pointer-events-auto mx-auto w-full bg-gradient-to-r from-slate-900/98 via-cyan-950/98 to-slate-900/98 backdrop-blur-md border-b border-cyan-500/30 shadow-lg shadow-cyan-500/10"
          style={{ animation: "slideDown 0.4s ease-out" }}
        >
          <style>{`
            @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>

          <div className="mx-auto max-w-4xl px-4 py-3">
            {/* Progress bar */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= currentStep ? "bg-cyan-400" : "bg-white/20"
                    }`}
                    style={{ width: i === currentStep ? "24px" : "12px" }}
                  />
                ))}
              </div>
              <span className="ml-auto text-xs text-white/50">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white/70 transition-colors text-xs"
                aria-label={t({ en: "Skip tour", es: "Saltar tour", pt: "Pular tour" })}
              >
                {t({ en: "Skip", es: "Saltar", pt: "Pular" })} ✕
              </button>
            </div>

            {/* Step content */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className="text-2xl shrink-0 mt-0.5"
                  role="img"
                  aria-hidden="true"
                >
                  {step.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">
                    {t(step.title)}
                  </p>
                  <p className="mt-0.5 text-xs text-cyan-100/80 leading-relaxed">
                    {t(step.description)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {pathname !== "/protected/perfil" && currentStep === 0 ? (
                  <Button
                    className="h-9 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4"
                    onClick={() => {
                      router.push("/protected/perfil");
                      setCurrentStep(0);
                    }}
                  >
                    {t({ en: "Go to profile →", es: "Ir a mi perfil →", pt: "Ir ao perfil →" })}
                  </Button>
                ) : (
                  <Button
                    className="h-9 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4"
                    onClick={handleNext}
                  >
                    {t(step.cta)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content being hidden under the fixed banner */}
      <div className="h-[88px] sm:h-[76px]" aria-hidden="true" />
    </>
  );
}
