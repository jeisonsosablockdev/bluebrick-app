import source from "./home.json";

export type FeatureItem = {
  title: string;
  description: string;
  action: string;
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
};

export type HeroStat = {
  label: string;
  value: string;
};

export const heroStats = source.heroStats as HeroStat[];
export const features = source.features as FeatureItem[];
export const properties = source.properties as PropertyItem[];
export const faqs = source.faqs as FaqItem[];
