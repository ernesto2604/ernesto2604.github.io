import { useT } from '../i18n';
import profile from '../content/profile.json';
import HalftoneWordmarkFooter from './ui/HalftoneWordmarkFooter';

// Canvas colours need literal hex: keep in sync with --text and --accent in tokens.css.
// Transparent ground so the fixed backdrop (Background.tsx) runs on under the footer without a seam.
const PALETTE = { background: 'transparent', ink: '#0D1015', warm: '#8C4A00' };

export default function Footer() {
  const t = useT();
  return (
    <HalftoneWordmarkFooter
      wordmark={t('footer.wordmark')}
      label={t('footer.rights', { year: __BUILD_YEAR__ })}
      meta={t('footer.built')}
      columns={[
        {
          title: t('menu.navigation'),
          links: [
            { label: t('nav.work'), href: '#retrieval' },
            { label: t('nav.about'), href: '#output' },
            { label: t('nav.contact'), href: '#contact' },
          ],
        },
        {
          title: t('menu.socials'),
          links: [
            { label: t('contact.linkedin'), href: profile.linkedin },
            { label: t('contact.github'), href: profile.github },
            { label: t('contact.email'), href: `mailto:${profile.email}` },
          ],
        },
        { title: t('footer.status'), links: [{ label: t('footer.source'), href: 'https://github.com/ernesto2604/portfolio' }] },
      ]}
      topLabel={t('footer.top')}
      topHref="#main"
      palette={PALETTE}
      grain={0}
      fontFamily='"Inter", ui-sans-serif, system-ui, sans-serif'
      monoFamily="var(--font-mono)"
      height="auto"
    />
  );
}
