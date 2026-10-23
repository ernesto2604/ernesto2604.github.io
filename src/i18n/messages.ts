// Server-side / build-time access to both locales. Never import this from client components.
import en from '../content/en.json';
import es from '../content/es.json';
import type { Locale, Messages } from './index';

const all: Record<Locale, Messages> = { en, es };
export const messagesFor = (locale: Locale) => all[locale];
