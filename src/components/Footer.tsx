import { ArrowUp } from 'lucide-react';
import { useT } from '../i18n';

export default function Footer() {
  const t = useT();
  return (
    <footer className="relative overflow-hidden px-5 pb-24 pt-16 sm:px-8 lg:pb-0">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[0.8125rem] text-ok">{t('footer.status')}</p>
        <div className="mt-6 flex flex-col gap-6 text-sm text-muted md:flex-row md:items-end md:justify-between">
          <p className="max-w-[52ch]">{t('footer.built')}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="https://github.com/ernesto2604/ernesto2604.github.io" className="inline-flex min-h-11 items-center hover:text-text">
              {t('footer.source')}
            </a>
            <a href="#main" className="inline-flex min-h-11 items-center gap-1.5 hover:text-text">
              {t('footer.top')}
              <ArrowUp className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </a>
            <span>{t('footer.rights', { year: __BUILD_YEAR__ })}</span>
          </div>
        </div>
      </div>
      {/* Oversized, cropped wordmark that closes the page (decorative). */}
      <p aria-hidden="true" className="wordmark pointer-events-none mt-10 select-none text-center font-display font-light leading-[0.78] tracking-[-0.04em]">
        {t('footer.wordmark')}
      </p>
    </footer>
  );
}
