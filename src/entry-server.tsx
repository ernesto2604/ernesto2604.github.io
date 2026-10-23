import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import type { Locale } from './i18n';

export { buildHead } from './seo/head';
export { messagesFor } from './i18n';

export function render(locale: Locale): string {
  return renderToString(
    <StrictMode>
      <App locale={locale} />
    </StrictMode>,
  );
}
