import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import type { Locale } from './i18n';
import './styles/global.css';

const locale: Locale = location.pathname.startsWith('/es') ? 'es' : 'en';
const messages = (locale === 'es' ? await import('./content/es.json') : await import('./content/en.json')).default;
const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App locale={locale} messages={messages} />
  </StrictMode>
);

// Dev serves an empty root (only the <!--app--> placeholder), so it renders instead of hydrating.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
