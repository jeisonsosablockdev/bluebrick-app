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
    <div className="transparency-page py-12 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6">
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
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* FIX & HOLD */}
          <div className={`${depthCard} transparency-accent-fuchsia rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
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
                    {t({ en: "Key characteristics:", es: "Características clave:", pt: "Características principales:" })}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4">
                    <li>{t({ en: "Horizon: medium and long term", es: "Horizonte: mediano y largo plazo", pt: "Horizonte: médio e longo prazo" })}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* DESARROLLO INMOBILIARIO */}
          <div className={`${depthCard} transparency-accent-blue rounded-3xl p-8 group border border-slate-800 bg-slate-900/80`}>
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
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className={`mt-16 sm:mt-24 rounded-[2rem] p-8 sm:p-12 text-center group border border-slate-800 bg-slate-900/60 ${depthSurface}`}>
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
              pt: "Nosso trabalho é ajudá-lo a entender qual se alinha melhor com seu perfil, objetivos e horizonte."
            })}
          </p>
          <div className="flex justify-center">
            <Link
              href="/marketplace"
              className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-bold text-white hover:bg-emerald-500 transition"
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

      <ContactFormSection />
      <FooterSection />
    </div>
  );
}
