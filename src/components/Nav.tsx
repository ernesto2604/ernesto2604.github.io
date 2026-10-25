import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Search } from 'lucide-react';
import { gsap } from 'gsap';
import { localePath, otherLocale, useLocale, useT } from '../i18n';
import { focusTarget, setScrollLock } from '../lib/scroll';
import { useActiveStage } from '../hooks/useActiveStage';
import profile from '../content/profile.json';

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

// Two lines: they tilt on hover and cross into an X when the menu is open (styles in global.css).
const Burger = () => (
  <span className="burger" aria-hidden="true">
    <span />
    <span />
  </span>
);

const LINKS = [
  { key: 'home', href: '#input' },
  { key: 'work', href: '#retrieval' },
  { key: 'about', href: '#output' },
  { key: 'contact', href: '#contact' },
] as const;
type LinkKey = (typeof LINKS)[number]['key'];

function LangToggle() {
  const t = useT();
  const locale = useLocale();
  const other = otherLocale(locale);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    try {
      localStorage.setItem('locale', other);
    } catch {
      /* storage blocked: the link still works */
    }
    e.currentTarget.href = localePath(other, location.hash);
  };
  // Segmented "EN / ES": the current language is plain text, the other one is the link.
  return (
    <p className="menu-lang">
      <span aria-hidden="true">{locale.toUpperCase()}</span>
      <span aria-hidden="true" className="opacity-40">/</span>
      <a href={localePath(other)} hrefLang={other} lang={other} onClick={onClick}>
        <span className="sr-only">{t('lang.switchTo')}: </span>
        {t('lang.short')}
      </a>
    </p>
  );}

// Side menu: a hamburger button opens a modal slide-over (native <dialog>: inert background, Escape closes).
// Tab wraps inside the panel and a backdrop click closes it. The motion is React Bits' StaggeredMenu (via the
// shadcn registry @react-bits) ported onto this dialog: colour layers sweep in one after another, then the panel,
// then the links rise in with their numbers; it all slides back out on close.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function playOpen(d: HTMLDialogElement) {
  const layers = [...d.querySelectorAll<HTMLElement>('.menu-prelayer')];
  const panel = d.querySelector<HTMLElement>('.menu-panel')!;
  const labels = [...d.querySelectorAll<HTMLElement>('.menu-link-label')];
  const links = [...d.querySelectorAll<HTMLElement>('.menu-link')];
  const fades = [...d.querySelectorAll<HTMLElement>('[data-menu-fade]')];
  gsap.killTweensOf([...layers, panel, ...labels, ...links, ...fades]);
  if (reduced()) return gsap.set([...layers, panel, ...labels, ...fades], { clearProps: 'all' });
  gsap.set([...layers, panel], { xPercent: 100 });
  gsap.set(labels, { yPercent: 140, rotate: 10 });
  gsap.set(links, { '--num': 0 });
  gsap.set(fades, { y: 25, opacity: 0 });
  const tl = gsap.timeline();
  layers.forEach((el, i) => tl.to(el, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07));
  const at = (layers.length - 1) * 0.07 + 0.08;
  tl.to(panel, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, at);
  tl.to(labels, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: 0.1 }, at + 0.1);
  tl.to(links, { '--num': 1, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, at + 0.2);
  tl.to(fades, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, at + 0.26);
}

function playClose(d: HTMLDialogElement, done: () => void) {
  const parts = [d.querySelector<HTMLElement>('.menu-panel')!, ...d.querySelectorAll<HTMLElement>('.menu-prelayer')];
  gsap.killTweensOf(parts);
  if (reduced()) return done();
  gsap.to(parts, { xPercent: 100, duration: 0.32, ease: 'power3.in', onComplete: done });
}
export default function Nav() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pointed, setPointed] = useState<LinkKey | null>(null);
  const stage = useActiveStage();
  const current: LinkKey = stage === 'input' ? 'home' : stage === 'output' ? 'about' : 'work';

  // Unlock before closing so an in-page link clicked in the panel can scroll right away. The panel is still
  // modal while it slides out, so a chosen section takes focus once it has closed.
  const close = (focusId?: string) => {
    const d = dialogRef.current!;
    setScrollLock(false);
    if (d.open)
      playClose(d, () => {
        d.close();
        if (focusId) focusTarget(focusId);
      });
  };
  const show = () => {
    const d = dialogRef.current!;
    if (d.open) return;
    setScrollLock(true);
    d.showModal();
    playOpen(d);
    // The language toggle comes first in the panel; start on the first section link instead.
    d.querySelector<HTMLElement>('.menu-link')?.focus();
    setOpen(true);
  };

  useEffect(() => {
    const d = dialogRef.current!;
    const onClose = () => {
      // Focus goes back to the button natively; a link chosen in the panel then moves it to its target.
      setOpen(false);
      setScrollLock(false);
    };
    // Escape slides the panel out instead of closing it at once.
    const onCancel = (e: Event) => {
      e.preventDefault();
      setScrollLock(false);
      playClose(d, () => d.close());
    };
    // The agent opens over everything, so the menu steps aside first (its button or Ctrl/Cmd+K).
    const onAgent = () => d.open && d.close();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') onAgent();
    };
    d.addEventListener('close', onClose);
    d.addEventListener('cancel', onCancel);
    addEventListener('agent:open', onAgent);
    addEventListener('keydown', onKey, true);
    return () => {
      d.removeEventListener('close', onClose);
      d.removeEventListener('cancel', onCancel);
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


  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={t('menu.open')}
        className="menu-button no-js-hide fixed right-4 top-4 z-40 grid size-12 place-items-center sm:right-6 sm:top-6"
      >
        <Burger />
      </button>

      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-label={t('menu.title')}
        data-lenis-prevent
        className="menu-dialog"
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {/* StaggeredMenu's pre-layers: they sweep in ahead of the panel. */}
        <div className="menu-prelayer menu-prelayer-amber" aria-hidden="true" />
        <div className="menu-prelayer menu-prelayer-slate" aria-hidden="true" />
        <nav aria-label={t('a11y.primaryNav')} className="menu-panel">
          {/* Top row, level with the close button. */}
          <div className="flex min-h-12 items-center" data-menu-fade>
            <LangToggle />
          </div>
          <p className="menu-label menu-label-rule mt-10" data-menu-fade>{t('menu.navigation')}</p>
          {/* The dot marks the section in view, and follows the pointer or keyboard focus across the links. */}
          <ul className="menu-links" onMouseLeave={() => setPointed(null)}>
            {LINKS.map(({ key, href }, i) => (
              <li key={key} className="overflow-hidden">
                <a
                  href={href}
                  onClick={() => close(href.slice(1))}
                  onMouseEnter={() => setPointed(key)}
                  onFocus={() => setPointed(key)}
                  onBlur={() => setPointed(null)}
                  aria-current={key === current ? 'location' : undefined}
                  className="menu-link"
                >
                  <span className="menu-dot" data-on={key === (pointed ?? current) || undefined} aria-hidden="true" />
                  <span className="menu-link-label">{t(key === 'home' ? 'menu.home' : `nav.${key}`)}</span>
                  <span className="menu-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="menu-label mt-12" data-menu-fade>{t('menu.socials')}</p>
          <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2" data-menu-fade>
            <li><a href={profile.linkedin} className="menu-social">{t('contact.linkedin')}</a></li>
            <li><a href={profile.github} className="menu-social">{t('contact.github')}</a></li>
            <li><a href={`mailto:${profile.email}`} className="menu-social">{t('contact.email')}</a></li>
          </ul>

          {AGENT_READY && (
            <div className="mt-auto pt-12" data-menu-fade>
              <button
                type="button"
                onClick={() => {
                  close();
                  openAgent();
                }}
                className="no-js-hide flex min-h-12 w-full items-center gap-3 rounded-full bg-accent-fill pl-5 pr-2 font-medium text-accent-ink"
              >
                <Search className="size-4" aria-hidden="true" strokeWidth={1.75} />
                <span className="whitespace-nowrap">{t('nav.agent')}</span>
                <kbd className="kbd-hint ml-auto whitespace-nowrap rounded-full bg-accent-ink/10 px-2.5 py-1 font-mono text-[0.8125rem]">{shortcut}</kbd>
              </button>
            </div>
          )}
        </nav>
        {/* Sits exactly over the open button and stays put while the panel slides in, so the lines seem to cross in place. */}
        <button type="button" onClick={() => close()} aria-label={t('menu.close')} className="menu-button menu-close no-js-hide fixed right-4 top-4 grid size-12 place-items-center sm:right-6 sm:top-6">
          <Burger />
        </button>
      </dialog>
    </>
  );
}
