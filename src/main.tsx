import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import type { Locale } from './i18n';
import './styles/global.css';

const locale: Locale = location.pathname.startsWith('/es') ? 'es' : 'en';
const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App locale={locale} />
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
