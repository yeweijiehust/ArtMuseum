import { locales, type Locale } from "@artmuseum/shared";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function getPreferredLocale(): Locale {
  const saved = window.localStorage.getItem("artmuseum.locale");
  if (saved && isLocale(saved)) {
    return saved;
  }
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

export function switchLocalePath(pathname: string, locale: Locale) {
  if (/^\/(en|zh)(\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(en|zh)/, `/${locale}`);
  }
  return `/${locale}`;
}
