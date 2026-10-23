import { ArrowDown, MapPin, Search } from 'lucide-react';
import Stage from '../components/Stage';
import TypedText from '../components/TypedText';
import { openAgent, useShortcutLabel } from '../components/Nav';
import { useT } from '../i18n';

export default function Input() {
  const t = useT();
  const shortcut = useShortcutLabel();

  return (
    <Stage id="input" index={1} className="flex min-h-[100svh] items-center pb-24 pt-32 lg:pt-36">
      <div className="max-w-5xl">
        <p className="eyebrow flex items-center gap-2.5">
          <span aria-hidden="true" className="signal-dot" />
          01 · {t('hero.queryLabel')}
        </p>
        <p className="mt-5 max-w-3xl font-display text-2xl font-light leading-snug text-muted sm:text-3xl">
          <TypedText text={t('hero.query')} />
        </p>

        <h1 className="rise mt-12 font-display text-5xl font-light leading-[0.92] tracking-[-0.02em] sm:mt-14">
          {t('hero.name')}
        </h1>
        <p className="fade-up mt-5 text-lg font-medium tracking-tight sm:text-xl" style={{ animationDelay: '120ms' }}>
          {t('hero.role')}
        </p>
        <p className="fade-up mt-5 max-w-[52ch] text-lg leading-relaxed text-muted" style={{ animationDelay: '220ms' }}>
          {t('hero.valueProp')}
        </p>

        <ul className="fade-up mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" style={{ animationDelay: '300ms' }}>
          <li className="flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('hero.location')}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
            {t('hero.availability')}
          </li>
        </ul>

        <div className="fade-up mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: '380ms' }}>
          <button
            type="button"
            onClick={openAgent}
            className="no-js-hide group inline-flex h-12 items-center gap-3 rounded-full bg-accent pl-5 pr-2 font-medium text-accent-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Search className="size-4" aria-hidden="true" strokeWidth={2} />
            {t('hero.ctaAgent')}
            <kbd className="rounded-full bg-accent-ink/10 px-2.5 py-1 font-mono text-xs">{shortcut}</kbd>
          </button>
          <a
            href="#rerank"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 font-medium transition-colors duration-200 hover:border-text"
          >
            {t('hero.ctaWork')}
            <ArrowDown className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </Stage>
  );
}
