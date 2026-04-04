import sourceEn from "./home.en.json";
import sourceEs from "./home.json";
import sourcePt from "./home.pt.json";

import type { AppLocale } from "@/lib/i18n";

export type FeatureItem = {
  title: string;
  description: string;
  action: string;
  actionHref?: string;
  icon?: string;
};

export type PropertyItem = {
  title: string;
  location: string;
  roi: string;
  image: string;
};

export type FaqItem = {
  question: string;
  answer: string;
  topic?: string;
};

export type HeroStat = {
  label: string;
  value: string;
};

type HomeContent = {
  heroStats: HeroStat[];
  features: FeatureItem[];
  properties: PropertyItem[];
  faqs: FaqItem[];
};

const HOME_CONTENT: Record<AppLocale, HomeContent> = {
  en: sourceEn as HomeContent,
  es: sourceEs as HomeContent,
  pt: sourcePt as HomeContent
};

export function getHomeContent(locale: AppLocale): HomeContent {
  return HOME_CONTENT[locale];
}
