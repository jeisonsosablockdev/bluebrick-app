export type LandingHeroStat = {
  id: string;
  valueEn: string;
  valueEs: string;
  labelEn: string;
  labelEs: string;
};

export type LandingProcessStep = {
  step: number;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
};

export const LANDING_HERO_STATS: LandingHeroStat[] = [
  {
    id: "pioneer",
    valueEn: "Be a pioneer",
    valueEs: "Se pionero",
    labelEn: "Discover projects in our marketplace.",
    labelEs: "Conoce los proyectos en nuestro marketplace."
  },
  {
    id: "marketplace_total",
    valueEn: "Marketplace properties",
    valueEs: "Propiedades en marketplace",
    labelEn: "Verified tokenized real estate assets",
    labelEs: "Activos inmobiliarios tokenizados y verificados"
  },
  {
    id: "traceability",
    valueEn: "24/7",
    valueEs: "24/7",
    labelEn: "Digital traceability on Solana",
    labelEs: "Trazabilidad digital en Solana"
  },
  {
    id: "avg_fraction",
    valueEn: "$200",
    valueEs: "$200",
    labelEn: "Average fraction cost",
    labelEs: "Costo promedio por fracción"
  }
];

export const LANDING_PROCESS_STEPS: LandingProcessStep[] = [
  {
    step: 1,
    titleEn: "Create your Wallet or Sign in",
    titleEs: "Conecta tu Billetera o Inicia Sesión",
    descEn: "Connect with Phantom or sign in securely using Web3 Auth.",
    descEs: "Conéctate con Phantom o inicia sesión de forma segura usando Web3 Auth."
  },
  {
    step: 2,
    titleEn: "Explore Fractional Real Estate",
    titleEs: "Explora Inmuebles Tokenizados",
    descEn: "Select premium properties with audited legal structures and guaranteed yields.",
    descEs: "Selecciona propiedades de alto valor con estructuras legales auditadas y rentabilidad garantizada."
  },
  {
    step: 3,
    titleEn: "Earn Monthly Rental Distribution",
    titleEs: "Recibe Rendimientos Mensuales",
    descEn: "Receive automatic rental dividends sent directly to your wallet in USDC or SOL.",
    descEs: "Recibe distribuciones de rentas automáticas enviadas directamente a tu billetera en USDC o SOL."
  }
];
