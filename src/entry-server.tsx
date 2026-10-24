import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import type { Locale } from './i18n';

export { buildHead } from './seo/head';
export { messagesFor } from './i18n/messages';
export { welcomeSequence, WELCOME_STEP_MS } from './lib/welcome';
import { messagesFor } from './i18n/messages';

export function render(locale: Locale): string {
  return renderToString(
    <StrictMode>
      <App locale={locale} messages={messagesFor(locale)} />
    </StrictMode>,
  );
}
