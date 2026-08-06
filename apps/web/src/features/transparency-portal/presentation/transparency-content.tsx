'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/locale-provider';
import { FooterSection } from '@/components/sections/footer';
import { ContactFormSection } from '@/components/sections/contact-form';

export function TransparencyContent() {
  const { t } = useI18n();

  const depthCard = "relative overflow-hidden transparency-depth-card";
  const depthSurface = "relative overflow-hidden transparency-depth-surface";
  const depthCode = "transparency-depth-code";

  return (
    <div className="transparency-page py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl text-gradientPrimary bg-clip-text text-transparent">
          {t({
            en: "Transparency & Strategy",
            es: "Transparencia y Estrategia",
            pt: "Transparência e Estratégia"
          })}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
          {t({
            en: "Invert with clarity and strategy. Discover our investment models and track our operations on-chain.",
            es: "Invierte con claridad y estrategia. Descubre nuestros modelos de inversión y rastrea nuestras operaciones de forma on-chain.",
            pt: "Invista com clareza e estratégia. Descubra nossos modelos de investimento e rastreie nossas operações on-chain."
          })}
        </p>
      </div>

      {/* Modelos de Inversion Section */}
      <section className="mt-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">
            {t({ en: "Investment Models", es: "Modelos de Inversión", pt: "Modelos de Investimento" })}
          </h2>
          <p className="mt-2 text-slate-400">
            {t({
              en: "Each model responds to a specific objective within our portfolio.",
              es: "Cada modelo responde a un objetivo específico dentro de nuestro portafolio.",
              pt: "Cada modelo responde a um objetivo específico em nosso portfólio."
            })}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* FIX & FLIP */}
          <div className={`${depthCard} transparency-accent-cyan rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/5 blur-[60px] transition-all group-hover:bg-cyan-400/20 group-hover:blur-[40px]"></div>
            <div className="relative z-10 flex h-full flex-col">
              <h3 className="mb-1 text-xl font-bold text-white uppercase">FIX & FLIP</h3>
              <p className="mb-4 font-semibold text-cyan-300">
                {t({ en: "Capital Growth", es: "Crecimiento de capital", pt: "Crescimento de capital" })}
              </p>
              <p className="mb-6 text-sm text-slate-300">
                {t({
                  en: "Acquire, renovate, and sell for fast and controlled returns in short cycles.",
                  es: "Adquiere, renueva y vende para retornos rápidos y controlados en ciclos cortos",
                  pt: "Adquira, renove e venda para retornos rápidos e controlados em ciclos curtos"
                })}
              </p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Ideal for investors looking for:", es: "Ideal para inversionistas que buscan:", pt: "Ideal para investidores que buscam:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Short and medium-term returns", es: "Retornos en el corto y mediano plazo", pt: "Retornos a curto e médio prazo" })}</li>
                    <li>{t({ en: "Tactical strategies", es: "Estrategias tácticas", pt: "Estratégias táticas" })}</li>
                    <li>{t({ en: "Efficient capital rotation", es: "Rotación eficiente de capital", pt: "Rotação eficiente de capital" })}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Key characteristics:", es: "Características clave:", pt: "Características principais:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Horizon: 6 to 12 months", es: "Horizonte: 6 a 12 meses", pt: "Horizonte: 6 a 12 meses" })}</li>
                    <li>{t({ en: "Approach: margin and execution", es: "Enfoque: margen y ejecución", pt: "Abordagem: margem e execução" })}</li>
                    <li>{t({ en: "Risk: controlled via strategic analysis", es: "Riesgo: controlado mediante análisis y compra estratégica", pt: "Risco: controlado através de análise" })}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* FIX & HOLD */}
          <div className={`${depthCard} transparency-accent-fuchsia rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-fuchsia-400/5 blur-[60px] transition-all group-hover:bg-fuchsia-400/20 group-hover:blur-[40px]"></div>
            <div className="relative z-10 flex h-full flex-col">
              <h3 className="mb-1 text-xl font-bold text-white uppercase">FIX & HOLD</h3>
              <p className="mb-4 font-semibold text-fuchsia-300">
                {t({ en: "Recurring Income", es: "Ingresos recurrentes", pt: "Renda recorrente" })}
              </p>
              <p className="mb-6 text-sm text-slate-300">
                {t({
                  en: "Buy, renovate, rent, and refinance assets for monthly cash flow and sustained appreciation.",
                  es: "Compra, renueva, renta y refinancia los activos para flujo mensual y plusvalía sostenida.",
                  pt: "Compre, renove, alugue e refinancie ativos para fluxo de caixa e valorização."
                })}
              </p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Ideal for investors looking for:", es: "Ideal para inversionistas que buscan:", pt: "Ideal para investidores que buscam:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Passive income", es: "Ingresos pasivos", pt: "Renda passiva" })}</li>
                    <li>{t({ en: "Wealth building", es: "Construcción de patrimonio", pt: "Construção de patrimônio" })}</li>
                    <li>{t({ en: "Long-term market exposure", es: "Exposición a largo plazo al mercado inmobiliario", pt: "Exposição de longo prazo no mercado" })}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Key characteristics:", es: "Características clave:", pt: "Características principais:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Horizon: medium and long term", es: "Horizonte: mediano y largo plazo", pt: "Horizonte: médio e longo prazo" })}</li>
                    <li>{t({ en: "Periodic income", es: "Ingresos periódicos", pt: "Rendas periódicas" })}</li>
                    <li>{t({ en: "Asset appreciation over time", es: "Plusvalía del activo en el tiempo", pt: "Valorização do ativo com o tempo" })}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* DESARROLLO INMOBILIARIO */}
          <div className={`${depthCard} transparency-accent-blue rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-400/5 blur-[60px] transition-all group-hover:bg-blue-400/20 group-hover:blur-[40px]"></div>
            <div className="relative z-10 flex h-full flex-col">
              <h3 className="mb-1 text-xl font-bold text-white uppercase">
                {t({ en: "REAL ESTATE DEV", es: "DESARROLLO INMOBILIARIO", pt: "DESENVOLVIMENTO IMOBILIÁRIO" })}
              </h3>
              <p className="mb-4 font-semibold text-blue-300">
                {t({ en: "Projects from scratch", es: "Proyectos desde cero", pt: "Projetos do zero" })}
              </p>
              <p className="mb-6 text-sm text-slate-300">
                {t({
                  en: "Structuring, development, and commercialization of holistic real estate projects.",
                  es: "Estructuración, desarrollo y comercialización de proyectos inmobiliarios con una visión integral.",
                  pt: "Estruturação, desenvolvimento e comercialização de projetos imobiliários de visão integral."
                })}
              </p>

              <div className="mt-auto space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Ideal for investors looking for:", es: "Ideal para inversionistas que buscan:", pt: "Ideal para investidores que buscam:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Superior returns", es: "Retornos superiores", pt: "Retornos superiores" })}</li>
                    <li>{t({ en: "Participation in robust projects", es: "Participación en proyectos robustos", pt: "Participação em projetos robustos" })}</li>
                    <li>{t({ en: "Long term vision", es: "Visión de largo plazo", pt: "Visão de largo plazo" })}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-white">
                    {t({ en: "Key characteristics:", es: "Características clave:", pt: "Características principales:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Higher complexity", es: "Mayor complejidad", pt: "Maior complexidade" })}</li>
                    <li>{t({ en: "Higher product control", es: "Mayor control del producto", pt: "Maior controle do produto" })}</li>
                    <li>{t({ en: "High appreciation value", es: "Potencial de valorización elevado", pt: "Potencial de valorização elevado" })}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className={`mt-16 sm:mt-24 rounded-[2rem] p-8 sm:p-12 text-center group border border-slate-800 bg-slate-900/60 ${depthSurface}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-fuchsia-500/0 to-blue-500/0 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-50 group-hover:from-cyan-500/10 group-hover:via-fuchsia-500/10 group-hover:to-blue-500/10"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            {t({
              en: "Each model responds to a different strategy.",
              es: "Cada modelo responde a una estrategia distinta.",
              pt: "Cada modelo responde a uma estratégia diferente."
            })}
          </h3>
          <p className="mb-8 text-lg text-slate-300">
            {t({
              en: "Our work is to help you understand which aligns best with your profile, goals, and horizon.",
              es: "Nuestro trabajo es ayudarte a entender cuál se alinea mejor con tu perfil, objetivos y horizonte.",
              pt: "Nosso trabalho é ajudá-lo a entender qual se alinea melhor com seu perfil, objetivos e horizonte."
            })}
          </p>
          <div className="flex justify-center">
            <Link
              href="/marketplace"
              className="marketplace-brand-pill inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              {t({
                en: "See active projects",
                es: "Ver proyectos activos",
                pt: "Ver projetos ativos"
              })}
            </Link>
          </div>
        </div>
      </section>

      {/* Como Invertir Timeline Section */}
      <section className="mt-24 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            {t({ en: "How to Invest", es: "Cómo invertir", pt: "Como Investir" })}
          </h2>
          <p className="mt-2 text-slate-400">
            {t({
              en: "Five clear steps to invest in our models with confidence.",
              es: "Cinco pasos claros para invertir en nuestros modelos con confianza.",
              pt: "Cinco passos claros para investir em nossos modelos com confiança."
            })}
          </p>
        </div>

        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          {/* Step 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-slate-950/90 text-slate-300 font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[inset_0_1px_14px_rgba(47,198,255,0.08),0_10px_24px_rgba(0,0,0,0.18)] z-10 transition-colors group-hover:bg-cyan-500 group-hover:text-slate-900">
              1
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl p-6 ${depthCard} transparency-accent-cyan border border-slate-800 bg-slate-900/80`}>
              <h3 className="font-bold text-white mb-2">{t({ en: "Step 1 – Investor Application", es: "Paso 1 – Aplicación del inversionista", pt: "Passo 1 – Aplicação do Investidor" })}</h3>
              <p className="text-sm text-slate-400">{t({ en: "The investor completes an initial application to define their goals, profile, and expectations.", es: "El inversionista completa una aplicación inicial para conocer sus objetivos, perfil y expectativas de inversión.", pt: "O investidor preenche uma aplicação inicial para definir seus objetivos, perfil e expectativas." })}</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-slate-950/90 text-slate-300 font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[inset_0_1px_14px_rgba(217,70,239,0.08),0_10px_24px_rgba(0,0,0,0.18)] z-10 transition-colors group-hover:bg-fuchsia-500 group-hover:text-slate-900">
              2
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl p-6 ${depthCard} transparency-accent-fuchsia border border-slate-800 bg-slate-900/80`}>
              <h3 className="font-bold text-white mb-2">{t({ en: "Step 2 – Profile Evaluation", es: "Paso 2 – Evaluación del perfil", pt: "Passo 2 – Avaliação do perfil" })}</h3>
              <p className="text-sm text-slate-400">{t({ en: "We analyze the investor profile to assure alignment with the strategy, horizon, and project risk.", es: "Analizamos el perfil del inversionista para asegurar alineación con la estrategia, el horizonte y el nivel de riesgo del proyecto.", pt: "Analisamos o perfil do investidor para assegurar o alinhamento com a estratégia, o horizonte e o risco do projeto." })}</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-slate-950/90 text-slate-300 font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[inset_0_1px_14px_rgba(59,130,246,0.08),0_10px_24px_rgba(0,0,0,0.18)] z-10 transition-colors group-hover:bg-blue-500 group-hover:text-slate-900">
              3
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl p-6 ${depthCard} transparency-accent-blue border border-slate-800 bg-slate-900/80`}>
              <h3 className="font-bold text-white mb-2">{t({ en: "Step 3 – Project Presentation", es: "Paso 3 – Presentación del proyecto", pt: "Passo 3 – Apresentação do projeto" })}</h3>
              <p className="text-sm text-slate-400">{t({ en: "The investment opportunity is presented with clear structure, returns, risks, and timeline.", es: "Se presenta la oportunidad de inversión con información clara sobre estructura, retornos, riesgos y timeline.", pt: "A oportunidade de investimento é apresentada com clareza sobre estrutura, retornos, riscos e linha do tempo." })}</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-slate-950/90 text-slate-300 font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[inset_0_1px_14px_rgba(245,158,11,0.08),0_10px_24px_rgba(0,0,0,0.18)] z-10 transition-colors group-hover:bg-amber-500 group-hover:text-slate-900">
              4
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl p-6 ${depthCard} transparency-accent-amber border border-slate-800 bg-slate-900/80`}>
              <h3 className="font-bold text-white mb-2">{t({ en: "Step 4 – Legal Framework", es: "Paso 4 – Firma y estructura legal", pt: "Passo 4 – Quadro Jurídico" })}</h3>
              <p className="text-sm text-slate-400">{t({ en: "The investment is formalized through private legal documentation and clear frameworks.", es: "La inversión se formaliza mediante documentación legal privada y estructuras claras diseñadas para cada proyecto.", pt: "O investimento é formalizado por documentação legal privada e estruturas claras." })}</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-slate-950/90 text-slate-300 font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[inset_0_1px_14px_rgba(16,185,129,0.08),0_10px_24px_rgba(0,0,0,0.18)] z-10 transition-colors group-hover:bg-emerald-500 group-hover:text-slate-900">
              5
            </div>
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl p-6 ${depthCard} transparency-accent-emerald border border-slate-800 bg-slate-900/80`}>
              <h3 className="font-bold text-white mb-2">{t({ en: "Step 5 – Execution & Reporting", es: "Paso 5 – Ejecución y reportes periódicos", pt: "Passo 5 – Execução e Relatórios" })}</h3>
              <p className="text-sm text-slate-400">{t({ en: "We execute the project and keep the investor informed through ongoing reports and tracking.", es: "Ejecutamos el proyecto y mantenemos al inversionista informado a través de reportes periódicos y seguimiento continuo.", pt: "Executamos o projeto e mantemos o investidor informado através de relatórios e acompanhamento." })}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="#"
            className="marketplace-brand-pill inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            {t({
              en: "Start as an investor",
              es: "Iniciar como inversionista",
              pt: "Iniciar como investidor"
            })}
          </Link>
        </div>
      </section>

      {/* Closing Statement & BlueBrick Partner Banner */}
      <section className={`mt-24 rounded-[2rem] p-8 sm:p-12 text-center group border border-slate-800 bg-slate-900/60 ${depthSurface}`}>
        <div className="transparency-closing-hover absolute inset-0 bg-gradient-to-t from-blue-900/10 via-slate-900/50 to-transparent opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="mb-6 text-3xl font-extrabold text-white sm:text-4xl text-gradientPrimary bg-clip-text text-transparent leading-tight">
            {t({
              en: "Investing with clarity is as important as investing with a strategy.",
              es: "Invertir con claridad es tan importante como invertir con estrategia.",
              pt: "Investir com clareza é tão importante quanto investir com estratégia."
            })}
          </h2>
          <p className="mb-10 text-lg text-slate-300 mx-auto max-w-3xl leading-relaxed">
            {t({
              en: "We merge the absolute transparency of blockchain with a seamless, ultra-fast transactional experience—fully backed by the real estate expertise and solidity of our partner, BlueBrick.",
              es: "Combinamos la transparencia absoluta de la tecnología blockchain y una experiencia transaccional fluida y ultrarrápida, respaldada por la trayectoria y solidez de nuestro partner, BlueBrick.",
              pt: "Combinamos a transparência absoluta da tecnologia blockchain a uma experiência transacional fluida e ultrarrápida, apoiada pela trajetória e solidez de nosso parceiro, BlueBrick."
            })}
          </p>
          <div className="flex justify-center">
            <Link
              href="/marketplace"
              className="marketplace-brand-pill inline-flex h-14 items-center justify-center rounded-full px-10 text-base font-bold text-white transition hover:-translate-y-0.5"
            >
              {t({
                en: "Start investing",
                es: "Empezar a invertir",
                pt: "Começar a investir"
              })}
            </Link>
          </div>
        </div>
      </section>

      {/* On-Chain Transparency Section */}
      <section className="mt-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">
            {t({ en: "On-Chain Honesty", es: "Honestidad On-Chain", pt: "Honestidade On-Chain" })}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Contracts */}
          <div className={`${depthCard} transparency-accent-cyan rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl transition-all group-hover:bg-cyan-400/10"></div>
            <div className="relative z-10">
              <h3 className="mb-3 text-xl font-semibold text-white">
                {t({ en: "Smart Contracts", es: "Contratos Inteligentes", pt: "Contratos Inteligentes" })}
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                {t({
                  en: "Review the source code of our Solana Programs verified on-chain.",
                  es: "Revisa el código fuente de nuestros Programas de Solana verificados on-chain.",
                  pt: "Revise o código fonte de nossos Programas Solana verificados on-chain."
                })}
              </p>
              <div className={`flex font-mono text-xs text-cyan-300 p-3 rounded-xl ${depthCode} bg-slate-950/60 border border-slate-800`}>
                {t({ en: "Coming soon...", es: "Próximamente...", pt: "Em breve..." })}
              </div>
            </div>
          </div>

          {/* Card 2: Wallets */}
          <div className={`${depthCard} transparency-accent-fuchsia rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-400/5 blur-3xl transition-all group-hover:bg-fuchsia-400/10"></div>
            <div className="relative z-10">
              <h3 className="mb-3 text-xl font-semibold text-white">
                {t({ en: "Treasury Wallets", es: "Billeteras de Tesorería", pt: "Carteiras do Tesouro" })}
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                {t({
                  en: "Monitor public addresses.",
                  es: "Monitorea las direcciones públicas.",
                  pt: "Monitore os endereços públicos."
                })}
              </p>
              <div className={`flex font-mono text-xs text-fuchsia-300 p-3 rounded-xl ${depthCode} bg-slate-950/60 border border-slate-800`}>
                {t({ en: "Coming soon...", es: "Próximamente...", pt: "Em breve..." })}
              </div>
            </div>
          </div>

          {/* Card 3: Nuestro SQUAD */}
          <div className={`${depthCard} transparency-accent-blue rounded-3xl p-8 sm:col-span-2 lg:col-span-1 group border border-slate-800 bg-slate-900/80`}>
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-blue-400/5 blur-3xl transition-all group-hover:bg-blue-400/10"></div>
            <div className="relative z-10">
              <h3 className="mb-3 text-xl font-semibold text-white">
                {t({ en: "Our SQUAD", es: "Nuestro SQUAD", pt: "Nosso SQUAD" })}
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                {t({
                  en: "Squads Multisig integration guaranteeing enterprise-grade security and no single point of failure.",
                  es: "Integración con Squads Multisig que garantiza seguridad de grado empresarial y elimina fallos de punto único.",
                  pt: "Integração com Squads Multisig para garantir segurança de nível empresarial."
                })}
              </p>
              <div className={`flex font-mono text-xs text-blue-300 p-3 rounded-xl ${depthCode} bg-slate-950/60 border border-slate-800`}>
                Squads V4 (Mainnet/Devnet)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand values divider */}
      <div className={`${depthSurface} transparency-accent-cyan mt-24 max-w-5xl mx-auto text-center py-10 rounded-3xl border border-slate-800 bg-slate-900/60`}>
        <p className="text-lg md:text-xl font-bold text-slate-300 tracking-[0.15em] uppercase flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
          <span className="text-cyan-100">{t({ en: "Structured Capital", es: "Capital estructurado", pt: "Capital estruturado" })}</span>
          <span className="hidden md:inline-block text-cyan-500/50 opacity-50">I</span>
          <span className="text-fuchsia-100">{t({ en: "Real Estate Execution", es: "Ejecución inmobiliaria", pt: "Execução imobiliária" })}</span>
          <span className="hidden md:inline-block text-fuchsia-500/50 opacity-50">I</span>
          <span className="text-blue-100">{t({ en: "Sustainable Results", es: "Resultados sostenibles", pt: "Resultados sustentáveis" })}</span>
        </p>
      </div>

      <ContactFormSection />
      <FooterSection />
    </div>
  );
}
