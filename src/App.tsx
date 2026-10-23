import Background from './components/Background';
import Nav from './components/Nav';
import PipelineIndicator from './components/PipelineIndicator';
import SmoothScroll from './components/SmoothScroll';
import { I18nProvider, useT, type Locale } from './i18n';
import Story from './sections/Story';

function Page() {
  const t = useT();
  return (
    <>
      <a href="#main" className="skip-link">{t('a11y.skip')}</a>
      <Background />
      <Nav />
      <PipelineIndicator />
      <main id="main" tabIndex={-1}>
        <Story />
      </main>
      <SmoothScroll />
    </>
  );
}

export default function App({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Page />
    </I18nProvider>
  );
}
