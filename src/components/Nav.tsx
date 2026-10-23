import { useEffect, useState, type MouseEvent } from 'react';
import { Search } from 'lucide-react';
import { localePath, otherLocale, useLocale, useT } from '../i18n';

// Flipped to true when the agent panel ships (Phase 6); until then no control promises it.
export const AGENT_READY = false;

export const openAgent = () => window.dispatchEvent(new CustomEvent('agent:open'));

export function useShortcutLabel() {
  const [label, setLabel] = useState('Ctrl K');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setLabel('⌘K');
  }, []);
  return label;
}

function LangToggle() {
  const t = useT();
  const other = otherLocale(useLocale());
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    try {
      localStorage.setItem('locale', other);
    } catch {
      /* storage blocked: the link still works */
    }
    e.currentTarget.href = localePath(other, location.hash);
  };
  return (
    <a
      href={localePath(other)}
      hrefLang={other}
      lang={other}
      onClick={onClick}
      aria-label={t('lang.switchTo')}
      className="grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium text-muted transition-colors duration-200 hover:bg-white/5 hover:text-text"
    >
      {t('lang.short')}
    </a>
  );
}

export default function Nav() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const link = 'rounded-full px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-text';
  return (
    <header className="fixed inset-x-3 top-3 z-40 mx-auto max-w-5xl">
      <nav aria-label={t('a11y.primaryNav')} className="glass flex h-14 items-center justify-between rounded-full pl-5 pr-2">
        <a href="#input" aria-label={t('nav.home')} className="flex items-center gap-2.5 text-sm font-medium tracking-tight">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Ernesto Contreras
        </a>
        <div className="flex items-center gap-1">
          <div className="hidden items-center md:flex">
            <a className={link} href="#rerank">{t('nav.work')}</a>
            <a className={link} href="#output">{t('nav.about')}</a>
            <a className={link} href="#contact">{t('nav.contact')}</a>
          </div>
          <LangToggle />
          {AGENT_READY && (
          <button
            type="button"
            onClick={openAgent}
            className="no-js-hide group flex h-10 items-center gap-2 rounded-full border border-line-strong/60 pl-3 pr-2 text-sm transition-colors duration-200 hover:border-accent/60"
          >
            <Search className="size-4 text-accent" aria-hidden="true" strokeWidth={1.75} />
            <span className="hidden sm:inline">{t('nav.agent')}</span>
            <span className="sr-only sm:hidden">{t('nav.agent')}</span>
            <kbd className="kbd-hint hidden rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8125rem] text-muted sm:inline">{shortcut}</kbd>
          </button>
          )}
        </div>
      </nav>
    </header>
  );
}
