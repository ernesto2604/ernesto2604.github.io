import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { translate, type Vars } from './translate';

export type Locale = 'en' | 'es';
export type Messages = typeof import('../content/en.json');

export const LOCALES: Locale[] = ['en', 'es'];

// Only the active locale's messages reach the client bundle (loaded in main.tsx); the server has both.
const I18nContext = createContext<{ locale: Locale; messages: Messages } | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
};

export const useLocale = () => useI18n().locale;
export const useMessages = (): Messages => useI18n().messages;

export function useT() {
  const { messages } = useI18n();
  return useCallback((key: string, vars?: Vars) => translate(messages, key, vars), [messages]);
}

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'es' : 'en');
export const localePath = (locale: Locale, hash = '') => (locale === 'es' ? '/es/' : '/') + hash;
