import { Button } from "@/components/ui/button";

export function PromoBannerSection() {
  return (
    <section className="rounded-3xl bg-gradientPrimary p-7 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <h3 className="max-w-2xl text-2xl font-bold leading-tight text-white md:text-3xl">
          Explora el ecosistema tokenizado de BRIDS: inversiones fraccionadas, ingresos pasivos y libertad financiera.
        </h3>
        <Button variant="ghost" className="bg-slate-950/75 px-6 text-white hover:bg-slate-950/90">
          Conocer más
        </Button>
      </div>
    </section>
  );
}
