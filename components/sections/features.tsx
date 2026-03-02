import { features } from "@/app/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function FeaturesSection() {
  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">
          Propiedad fraccionada, <span className="bg-gradientPrimary bg-clip-text text-transparent">inversión multiplicada</span>
        </H2>
        <Lead className="mx-auto mt-3 max-w-2xl">Tres formas de participar en activos premium sin procesos complejos.</Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradientPrimary text-white">•</div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
            <Button>{feature.action}</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
