import { createContext, useCallback, useContext, type ReactNode } from 'react';
import en from '../content/en.json';
import es from '../content/es.json';
import { translate, type Vars } from './translate';

export type Locale = 'en' | 'es';
export type Messages = typeof en;

export const LOCALES: Locale[] = ['en', 'es'];
const dicts: Record<Locale, Messages> = { en, es };

const LocaleContext = createContext<Locale>('en');

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export const useMessages = (): Messages => dicts[useLocale()];

export function useT() {
  const locale = useLocale();
  return useCallback((key: string, vars?: Vars) => translate(dicts[locale], key, vars), [locale]);
}

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'es' : 'en');
export const localePath = (locale: Locale, hash = '') => (locale === 'es' ? '/es/' : '/') + hash;
export const messagesFor = (locale: Locale) => dicts[locale];
