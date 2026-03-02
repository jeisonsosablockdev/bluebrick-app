import { H2, Lead } from "@/components/ui/typography";

export function WelcomeSection() {
  return (
    <section className="py-14 text-center">
      <H2 className="text-white">
        Bienvenido al <span className="bg-gradientPrimary bg-clip-text text-transparent">futuro</span> de la inversión inmobiliaria.
      </H2>
      <Lead className="mx-auto mt-3 max-w-2xl">
        Invierte desde casa en fracciones reales, con respaldo legal y visualización clara de rendimiento.
      </Lead>
    </section>
  );
}
