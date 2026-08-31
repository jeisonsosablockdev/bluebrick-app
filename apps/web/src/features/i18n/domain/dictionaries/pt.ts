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
    toggleThemeAria: "Alternar tema claro ou escuro",
  },
  nav: {
    dashboard: "Painel",
    properties: "Propriedades",
    portfolio: "Portfólio",
    governance: "Governança",
    support: "Suporte",
  },
  landing: {
    badge: "Plataforma Privada de Investimento Imobiliário",
    headline: "Plataforma Privada de Investimento Imobiliário",
    subtitle:
      "Acesse seu portfólio institucional, acompanhe distribuições mensais, consulte a rentabilidade ponderada e reinvista capital em oportunidades exclusivas.",
    securityBadge: "Governança institucional · Máxima segurança e privacidade para investidores",
    footerText: "BlueBrick Platform · Investimentos Imobiliários Fracionados",
  },
  loginCard: {
    headerTitle: "Acesso do Investidor",
    privatePortalBadge: "Portal Privado",
    exclusiveAccessTitle: "Acesso exclusivo para investidores",
    loginSubtitle: "Entre com seu e-mail pessoal ou corporativo para gerenciar seus investimentos.",
    emailLoginButton: "Entrar com seu e-mail",
    disclaimerNote: "Plataforma de Investimentos BlueBrick · Acesso seguro e institucional para investidores verificados.",
    supportedProvidersLabel: "Compatível com Google, Microsoft, Apple e Yahoo",
  },
  logoutModal: {
    title: "Encerrar sessão?",
    description: "Tem certeza de que deseja sair da sua conta? Você precisará entrar novamente para acessar seu portfólio.",
    dontAskAgain: "Não perguntar novamente",
    confirmButton: "Sair",
    cancelButton: "Cancelar",
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
      title: "Faça seu patrimônio crescer",
      description:
        "Descubra novas oportunidades imobiliárias selecionadas pela Blue Brick. Amplie sua exposição a ativos reais, diversifique seu capital e encontre novas oportunidades para continuar construindo patrimônio.",
      ctaButton: "Investir agora",
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
