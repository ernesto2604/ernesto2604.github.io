import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { localePath, otherLocale, useLocale, useT } from '../i18n';
import { setScrollLock } from '../lib/scroll';

// Flipped to true when the agent panel ships (Phase 6); until then no control promises it.
export const AGENT_READY = true;

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
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium transition-colors duration-200 hover:bg-line"
    >
      {t('lang.short')}
      <span className="text-muted">{t('lang.switchTo')}</span>
    </a>
  );
}

// Side menu: a hamburger button opens a modal slide-over (native <dialog>: inert background, Escape closes).
// Tab wraps inside the panel and a backdrop click closes it.
export default function Nav() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Unlock before closing so an in-page link clicked in the panel can scroll right away.
  const close = () => {
    setScrollLock(false);
    dialogRef.current?.close();
  };
  const show = () => {
    const d = dialogRef.current!;
    if (d.open) return;
    setScrollLock(true);
    d.showModal();
    setOpen(true);
  };

  useEffect(() => {
    const d = dialogRef.current!;
    const onClose = () => {
      // Focus goes back to the button natively; a link chosen in the panel then moves it to its target.
      setOpen(false);
      setScrollLock(false);
    };
    // The agent opens over everything, so the menu steps aside first (its button or Ctrl/Cmd+K).
    const onAgent = () => d.open && d.close();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') onAgent();
    };
    d.addEventListener('close', onClose);
    addEventListener('agent:open', onAgent);
    addEventListener('keydown', onKey, true);
    return () => {
      d.removeEventListener('close', onClose);
      removeEventListener('agent:open', onAgent);
      removeEventListener('keydown', onKey, true);
    };
  }, []);

  // Focus trap: wrap Tab and Shift+Tab at the panel's edges.
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== 'Tab') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    const first = items[0];
    const last = items.at(-1)!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const link = 'flex min-h-12 items-center rounded-card px-3 text-2xl font-medium tracking-tight transition-colors duration-200 hover:bg-surface-2';

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={t('menu.open')}
        className="menu-button no-js-hide fixed right-4 top-4 z-40 grid size-12 place-items-center rounded-full sm:right-6 sm:top-6"
      >
        <Menu className="size-5" aria-hidden="true" strokeWidth={1.75} />
      </button>

      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-label={t('menu.title')}
        data-lenis-prevent
        className="menu-dialog text-text"
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <nav aria-label={t('a11y.primaryNav')} className="flex h-full flex-col gap-8 px-5 pb-8 pt-4">
          <div className="flex items-center justify-between gap-4">
            <a href="#input" onClick={close} aria-label={t('nav.home')} className="flex min-h-11 items-center gap-2.5 px-3 text-sm font-medium">
              <span className="size-1.5 rounded-full bg-accent-fill" aria-hidden="true" />
              {t('hero.name')}
            </a>
            <button type="button" onClick={close} aria-label={t('menu.close')} className="no-js-hide grid size-12 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
              <X className="size-5" aria-hidden="true" strokeWidth={1.75} />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            <li><a className={link} href="#rerank" onClick={close}>{t('nav.work')}</a></li>
            <li><a className={link} href="#output" onClick={close}>{t('nav.about')}</a></li>
            <li><a className={link} href="#contact" onClick={close}>{t('nav.contact')}</a></li>
          </ul>
          <div className="mt-auto flex flex-col items-start gap-3">
            {AGENT_READY && (
              <button
                type="button"
                onClick={() => {
                  close();
                  openAgent();
                }}
                className="no-js-hide flex min-h-12 w-full items-center gap-3 rounded-full bg-accent-fill pl-5 pr-2 font-medium text-accent-ink"
              >
                <Search className="size-4" aria-hidden="true" strokeWidth={1.75} />
                {t('nav.agent')}
                <kbd className="kbd-hint ml-auto whitespace-nowrap rounded-full bg-surface px-2.5 py-1 font-mono text-[0.8125rem] text-muted">{shortcut}</kbd>
              </button>
            )}
            <LangToggle />
          </div>
        </nav>
      </dialog>
    </>
  );
}
