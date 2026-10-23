import { I18nProvider, type Locale } from './i18n';

export default function App({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <main id="main" />
    </I18nProvider>
  );
}
