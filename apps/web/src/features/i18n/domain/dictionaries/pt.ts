/**
 * @file apps/web/src/features/i18n/domain/dictionaries/pt.ts
 * @description Layer 3: Domain - Canonical Portuguese (pt) Localization Dictionary.
 */

import type { Dictionary } from "../models/locale-types";

export const pt: Dictionary = {
  common: {
    brandName: "BLUE BRICK",
    loading: "Carregando...",
    error: "Ocorreu um erro",
    retry: "Tentar novamente",
    save: "Salvar",
    cancel: "Cancelar",
    back: "Voltar",
    close: "Fechar",
    learnMore: "Saiba mais",
    language: "Idioma",
    selectLanguage: "Selecionar idioma",
    logout: "Sair",
  },
  nav: {
    dashboard: "Painel",
    properties: "Propriedades",
    portfolio: "Portfólio",
    governance: "Governança",
    support: "Suporte",
  },
  landing: {
    badge: "Plataforma Privada de Investimento Imobiliário Fracionado",
    headline: "Invista em ativos imobiliários premium com retornos transparentes",
    subtitle:
      "Acesse seu portfólio institucional, acompanhe distribuições mensais, consulte a rentabilidade ponderada e reinvista capital em oportunidades exclusivas.",
    securityBadge: "Governança Institucional · Segurança WorkOS AuthKit & Neon Cloud",
    footerText: "BlueBrick Platform · Investimentos Imobiliários Fracionados · Conectado à Vercel Cloud",
  },
  loginCard: {
    headerTitle: "Acesso do Investidor",
    verifiedBadge: "Demo Verificada",
    tierLabel: "Investidor Privado",
    activeProjectsCount: "{count} Projetos Ativos",
    enterDashboardButton: "Entrar no Painel",
    emailLoginButton: "Entrar com E-mail",
    disclaimerNote: "* Plataforma de Investimentos BlueBrick · Acesso demo instantâneo ou federado.",
  },
  dashboard: {
    totalInvested: "Patrimônio total investido",
    weightedRoi: "ROI médio ponderado: {roi}%",
    activeProperties: "Ativas",
    concludedProperties: "Concluídas",
    projectedEarnings: "Ganho projetado",
    portfolioDistribution: "Distribuição do portfólio",
    allocation: "Alocação",
    myInvestments: "Meus investimentos",
    portfolioDetail: "Detalhes do portfólio",
    tableColumns: {
      project: "Projeto",
      invested: "Investido",
      roi: "ROI",
      status: "Status",
      timing: "Prazo",
    },
    status: {
      active: "Ativa",
      concluded: "Concluída",
      pending: "Pendente",
    },
    cards: {
      investedAmount: "Valor investido",
      estimatedRoi: "ROI estimado",
      returnDate: "Data de retorno",
      closingDate: "Data de fechamento",
      changeAvatar: "Alterar avatar",
      memberSince: "desde {year}",
    },
    reinvestment: {
      badge: "Novas oportunidades para {name}",
      title: "Seu capital concluído já está pronto para trabalhar novamente.",
      description:
        "Reinvista os rendimentos dos seus projetos concluídos nestas oportunidades selecionadas por nossa equipe, com retornos estimados superiores à média do seu portfólio atual.",
      ctaButton: "Reinvestir agora",
      estimatedRoi: "ROI est. {roi}%",
      minInvestmentFrom: "a partir de {amount}",
    },
  },
  wallet: {
    connect: "Conectar Carteira",
    disconnect: "Desconectar",
    connecting: "Conectando...",
    connected: "Conectado",
    error: "Erro na carteira",
  },
};
