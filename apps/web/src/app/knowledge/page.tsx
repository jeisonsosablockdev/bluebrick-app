import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { KnowledgePageClient } from "@/features/knowledge";
import { createPageMetadata } from "@/lib/seo";
import { createKnowledgeHubTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Centro de Conocimiento | BRIDS",
  description: "Centro de conocimiento con artículos, guías y glosario de tokenización inmobiliaria.",
  path: "/knowledge",
  section: "knowledge"
});

export default function KnowledgeLayerPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Knowledge", href: "/knowledge" }
  ];
  const schemas = createKnowledgeHubTemplateSchemas({
    title: "Knowledge",
    summary: "Centro de conocimiento con artículos, guías y glosario de tokenización inmobiliaria.",
    path: "/knowledge",
    breadcrumbs
  });

  const sampleArticles = [
    {
      slug: "tokenizacion-inmobiliaria-101",
      title: "Fundamentos de la Tokenización Inmobiliaria",
      description: "Aprende cómo la blockchain transforma activos inmobiliarios en fracciones digitales líquidas.",
      category: "educational" as const,
      publishedAt: "2026-08-01",
      author: "Equipo BRIDS",
      readTimeMinutes: 5
    },
    {
      slug: "estructura-legal-spv",
      title: "Estructura Legal y SPVs en Bienes Raíces Digitales",
      description: "Descubre cómo los Vehículos de Propósito Especial respaldan notarialmente cada token.",
      category: "regulatory" as const,
      publishedAt: "2026-08-03",
      author: "Legal Dept BRIDS",
      readTimeMinutes: 7
    },
    {
      slug: "trazabilidad-onchain-solana",
      title: "Trazabilidad 24/7 y Contratos Inteligentes en Solana",
      description: "Análisis técnico de los programas on-chain para distribución automática de dividendos.",
      category: "technical" as const,
      publishedAt: "2026-08-05",
      author: "Blockchain Core Team",
      readTimeMinutes: 6
    }
  ];

  const sampleDefinitions = [
    {
      term: "SPV (Special Purpose Vehicle)",
      definition: "Entidad jurídica propietaria exclusiva del inmueble físico, cuyas acciones están tokenizadas.",
      category: "legal" as const
    },
    {
      term: "APY (Annual Percentage Yield)",
      definition: "Tasa de rendimiento anual estimada proveniente de los alquileres del inmueble.",
      category: "real-estate" as const
    },
    {
      term: "Fracción Digital",
      definition: "Unidad divisible de un activo inmobiliario registrada transparentemente en la red de Solana.",
      category: "web3" as const
    }
  ];

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-hub" schemas={schemas} />
      <KnowledgePageClient
        initialArticles={sampleArticles}
        initialDefinitions={sampleDefinitions}
      />
    </>
  );
}

