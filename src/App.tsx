import Background from './components/Background';
import Nav from './components/Nav';
import ProgressPill from './components/ProgressPill';
import SmoothScroll from './components/SmoothScroll';
import { I18nProvider, useT, type Locale, type Messages } from './i18n';
import AgentHost from './agent/AgentHost';
import Footer from './components/Footer';
import Generate from './sections/Generate';
import Output from './sections/Output';
import Stack from './sections/Stack';
import Story from './sections/Story';

function Page() {
  const t = useT();
  return (
    <>
      <a href="#main" className="skip-link">{t('a11y.skip')}</a>
      <Background />
      <Nav />
      <ProgressPill />
      <main id="main" tabIndex={-1}>
        <Story />
        <Generate />
        <Stack />
        <Output />
      </main>
      <Footer />
      <AgentHost />
      <SmoothScroll />
    </>
  );
}

export default function App({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      <Page />
    </I18nProvider>
  );
}
