import { Button } from "@/components/ui/button";

const investmentStats = [
  { value: "15K+", label: "Inversionistas" },
  { value: "$2.5M+", label: "Invertido" },
  { value: "500+", label: "Propiedades" },
  { value: "20%", label: "ROI Promedio" }
];

export function FirstInvestmentSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradientPrimary px-6 py-12 md:px-10 md:py-16">
      <div className="pointer-events-none absolute -left-6 top-5 h-16 w-16 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -right-8 bottom-12 h-16 w-16 rounded-full border border-white/20" />

      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl text-white">↗</div>
        <h3 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">Tu primera inversión te está esperando.</h3>
        <p className="mt-4 text-xl font-semibold text-white/95">⏰ Aprovecha antes que cierre la ronda.</p>

        <div className="mt-7 flex flex-col items-center justify-center gap-4 md:flex-row">
          <Button className="bg-white px-12 py-3 text-base font-bold text-slate-900 hover:bg-white/90">Invierte Ahora</Button>
          <div className="text-left text-sm text-white/95">
            <p>• Inversión mínima desde $1,000 USD</p>
            <p>• ROI promedio del 15-25% anual</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-5 text-center md:grid-cols-4">
        {investmentStats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-base text-white/90">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
