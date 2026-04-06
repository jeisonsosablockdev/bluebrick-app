export type LocalizedCopy = {
  en: string;
  es: string;
  pt: string;
};

export type SectionT = (copy: LocalizedCopy) => string;
