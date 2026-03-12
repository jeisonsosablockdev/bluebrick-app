import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";
import { H2, Lead } from "@/components/ui/typography";
import { listProperties } from "@/lib/property-service";

export function PropertiesSection() {
  const properties = listProperties({}).slice(0, 3);

  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">Propiedades Destacadas</H2>
        <Lead className="mx-auto mt-2 max-w-xl">Descubre oportunidades activas en ubicaciones de alta demanda.</Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden p-0">
            <Image src={property.image} alt={property.title} width={600} height={360} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{property.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
                  {listingStatusLabel(property.listingStatus)}
                </span>
              </div>
              <p className="text-sm text-slate-400">{property.locationLabel}</p>
              <p className="text-sm font-semibold text-cyan-300">ROI: {property.annualRoiPct.toFixed(1)}%</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/marketplace"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
        >
          Ver marketplace
        </Link>
      </div>
    </section>
  );
}
