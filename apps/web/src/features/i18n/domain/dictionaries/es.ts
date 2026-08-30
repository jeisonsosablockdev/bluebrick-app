/**
 * @file apps/web/src/features/i18n/domain/dictionaries/es.ts
 * @description Layer 3: Domain - Canonical Spanish (es) Localization Dictionary.
 */

import type { Dictionary } from "../models/locale-types";

export const es: Dictionary = {
  common: {
    brandName: "BLUE BRICK",
    loading: "Cargando...",
    error: "Ocurrió un error",
    retry: "Reintentar",
    save: "Guardar",
    cancel: "Cancelar",
    back: "Volver",
    close: "Cerrar",
    learnMore: "Conoce más",
    language: "Idioma",
    selectLanguage: "Seleccionar idioma",
    logout: "Cerrar sesión",
  },
  nav: {
    dashboard: "Dashboard",
    properties: "Propiedades",
    portfolio: "Portafolio",
    governance: "Gobernanza",
    support: "Soporte",
  },
  landing: {
    badge: "Plataforma Privada de Inversión Inmobiliaria Fraccionada",
    headline: "Invierte en activos inmobiliarios premium con retornos transparentes",
    subtitle:
      "Accede a tu portafolio institucional, monitorea distribuciones mensuales, consulta el rendimiento ponderado y reinvierte capital en oportunidades exclusivas.",
    securityBadge: "Gobernanza institucional · Seguridad WorkOS AuthKit & Neon Cloud",
    footerText: "BlueBrick Platform · Inversiones Inmobiliarias Fraccionadas · Conectado a Vercel Cloud",
  },
  loginCard: {
    headerTitle: "Acceso de Inversionista",
    verifiedBadge: "Demo Verificada",
    tierLabel: "Inversionista Privado",
    activeProjectsCount: "{count} Proyectos Activos",
    enterDashboardButton: "Entrar al Dashboard",
    emailLoginButton: "Continuar con Correo Electrónico",
    disclaimerNote: "* Plataforma de Inversiones BlueBrick · Acceso demo instantáneo o federado.",
  },
  logoutModal: {
    title: "¿Cerrar sesión?",
    description: "¿Estás seguro de que deseas salir de tu cuenta? Tendrás que volver a ingresar tus credenciales para acceder a tu portafolio.",
    dontAskAgain: "No volver a preguntar",
    confirmButton: "Cerrar sesión",
    cancelButton: "Cancelar",
  },
  dashboard: {
    totalInvested: "Patrimonio invertido total",
    weightedRoi: "ROI promedio ponderado: {roi}%",
    activeProperties: "Activas",
    concludedProperties: "Concluidas",
    projectedEarnings: "Ganancia proyectada",
    portfolioDistribution: "Distribución del portafolio",
    allocation: "Asignación",
    myInvestments: "Mis inversiones",
    portfolioDetail: "Detalle del portafolio",
    tableColumns: {
      project: "Proyecto",
      invested: "Invertido",
      roi: "ROI",
      status: "Estado",
      timing: "Timing",
    },
    status: {
      active: "Activa",
      concluded: "Concluida",
      pending: "Pendiente",
    },
    cards: {
      investedAmount: "Monto invertido",
      estimatedRoi: "ROI estimado",
      returnDate: "Fecha de retorno",
      closingDate: "Fecha de cierre",
      changeAvatar: "Cambiar avatar",
      memberSince: "desde {year}",
    },
    reinvestment: {
      badge: "Nuevas oportunidades para {name}",
      title: "Tu capital concluido ya está listo para trabajar de nuevo.",
      description:
        "Reinvierte las ganancias de tus proyectos concluidos en estas oportunidades seleccionadas por nuestro equipo, con retornos estimados superiores al promedio de tu portafolio actual.",
      ctaButton: "Reinvertir ahora",
      estimatedRoi: "ROI est. {roi}%",
      minInvestmentFrom: "desde {amount}",
    },
  },
  wallet: {
    connect: "Conectar Wallet",
    disconnect: "Desconectar",
    connecting: "Conectando...",
    connected: "Conectado",
    error: "Error de wallet",
  },
};
