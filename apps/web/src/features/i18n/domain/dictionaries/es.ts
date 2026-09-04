/**
 * @file apps/web/src/features/i18n/domain/dictionaries/es.ts
 * @description Layer 3: Domain - Canonical Spanish (es) Localization Dictionary.
 */

import type { Dictionary } from "../models/locale-types";

export const es: Dictionary = {
  common: {
    brandName: "Blue Brick",
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
    toggleThemeAria: "Cambiar tema claro u oscuro",
  },
  nav: {
    dashboard: "Dashboard",
    properties: "Propiedades",
    portfolio: "Portafolio",
    governance: "Gobernanza",
    support: "Soporte",
  },
  landing: {
    badge: "Plataforma Privada de Inversión Inmobiliaria",
    headline: "Plataforma Privada de Inversión Inmobiliaria",
    subtitle:
      "Accede a tu portafolio institucional, monitorea distribuciones mensuales, consulta el rendimiento ponderado y reinvierte capital en oportunidades exclusivas.",
    securityBadge: "Gobernanza institucional · Máxima seguridad y privacidad para inversionistas",
    footerText: "BlueBrick Platform · Inversiones Inmobiliarias Fraccionadas",
  },
  loginCard: {
    headerTitle: "Acceso de Inversionista",
    privatePortalBadge: "Portal Privado",
    exclusiveAccessTitle: "Acceso exclusivo para inversionistas",
    loginSubtitle: "Ingresa con tu correo personal o corporativo para gestionar tus inversiones.",
    emailLoginButton: "Ingresa con tu correo",
    disclaimerNote: "Plataforma de Inversiones BlueBrick · Acceso seguro e institucional para inversionistas verificados.",
    supportedProvidersLabel: "Compatible con Google, Microsoft, Apple y Yahoo",
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
      title: "Haz crecer tu patrimonio",
      description:
        "Descubre nuevas oportunidades inmobiliarias seleccionadas por Blue Brick. Amplía tu exposición a activos reales, diversifica tu capital y encuentra nuevas oportunidades para seguir construyendo patrimonio.",
      ctaButton: "Invertir ahora",
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
