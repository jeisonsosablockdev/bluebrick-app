import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

const steps = [
  "Regístrate y valida identidad",
  "Conecta tu perfil de inversión",
  "Selecciona propiedad objetivo",
  "Recibe rendimiento periódicamente"
];

export function ProcessSection() {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradientPanel p-7 md:p-10">
      <div className="mb-8 text-center">
        <H2 className="text-white">Cómo Empezar</H2>
        <Lead className="mx-auto mt-2 max-w-xl">Cuatro pasos simples para comenzar a generar ingresos pasivos.</Lead>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={step} className="bg-slate-950/45">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradientPrimary text-xs font-bold text-white">
              {index + 1}
            </div>
            <p className="text-sm text-slate-200">{step}</p>
          </Card>
        ))}
      </div>

      <div className="mt-7 text-center">
        <Button className="px-7">Empieza con una cuenta gratis</Button>
      </div>
    </section>
  );
}
