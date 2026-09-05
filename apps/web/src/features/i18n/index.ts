/**
 * ============================================================================
 * Feature: Internationalization (i18n) & Localization System
 * ============================================================================
 * Public Barrel Export following 4-Layer Feature-Driven Design.
 */

// Layer 1: Presentation Components & Providers
export * from "./presentation/components/locale-switcher";
export * from "./presentation/components/i18n-provider";
export * from "./presentation/components/flag-icons";

// Layer 2: Application Hooks, Server Actions & Queries
export * from "./application/hooks/use-i18n";
export * from "./application/actions/locale-cookie-actions";
export * from "./application/queries/get-dictionary-query";

// Layer 3: Domain Models, Ports, Schemas, Formatters & Dictionaries
export * from "./domain/models/locale-types";
export * from "./domain/schemas/i18n-dictionary-schema";
export * from "./domain/ports/i18n-port";
export * from "./domain/formatters/locale-formatters";
export * from "./domain/dictionaries/es";
export * from "./domain/dictionaries/en";
export * from "./domain/dictionaries/pt";

// Layer 4: Infrastructure Adapters & Detectors
export * from "./infrastructure/cookie-locale-adapter";
export * from "./infrastructure/browser-locale-detector";
export * from "./infrastructure/dictionary-loader-adapter";
