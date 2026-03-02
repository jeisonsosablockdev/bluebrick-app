import Image from "next/image";

import { properties } from "@/app/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function PropertiesSection() {
  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">Propiedades Destacadas</H2>
        <Lead className="mx-auto mt-2 max-w-xl">Descubre oportunidades activas en ubicaciones de alta demanda.</Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.title} className="overflow-hidden p-0">
            <Image src={property.image} alt={property.title} width={600} height={360} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-4">
              <h3 className="text-base font-semibold text-white">{property.title}</h3>
              <p className="text-sm text-slate-400">{property.location}</p>
              <p className="text-sm font-semibold text-cyan-300">{property.roi}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button>Ver todas las propiedades</Button>
      </div>
    </section>
  );
}
