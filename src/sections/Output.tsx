import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, Mail, Phone } from 'lucide-react';
import Portrait from '../components/Portrait';
import Thinking, { useGenerate } from '../components/Thinking';
import profile from '../content/profile.json';
import { useLocale, useMessages, useT } from '../i18n';

function Contact() {
  const t = useT();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  // The phone number is joined on the client so it is not sitting in the HTML for scrapers.
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => setPhone(profile.phone.join(' ')), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };
  const cv = profile.cv[locale as 'en' | 'es'];
  const row = 'flex min-h-14 items-center justify-between gap-4 rounded-card bg-surface px-5 transition-colors duration-200 hover:bg-surface-2';

  return (
    <div id="contact" className="scroll-mt-28">
      <h3 className="font-display text-3xl leading-none">{t('contact.title')}</h3>
      <p className="mt-4 max-w-[46ch] text-muted">{t('contact.lead')}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`mailto:${profile.email}`} className="inline-flex h-12 items-center gap-2.5 rounded-full bg-accent-fill px-6 font-medium text-accent-ink transition-transform duration-200 hover:-translate-y-0.5">
          <Mail className="size-4" aria-hidden="true" strokeWidth={2} />
          {profile.email}
        </a>
        <button type="button" onClick={copy} className="no-js-hide inline-flex h-12 items-center gap-2 rounded-full bg-surface-2 px-5 font-medium transition-colors duration-200 hover:bg-line">
          {copied ? <Check className="size-4 text-ok" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" strokeWidth={1.75} />}
          {copied ? t('contact.copied') : t('contact.copy')}
        </button>
        <span className="sr-only" aria-live="polite">{copied ? t('contact.copied') : ''}</span>
      </div>
      <ul className="mt-8 grid gap-2">
        <li>
          <a href={profile.linkedin} className={row}>
            <span>{t('contact.linkedin')}</span>
            <ArrowUpRight className="size-4 text-muted" aria-hidden="true" strokeWidth={1.75} />
          </a>
        </li>
        <li>
          <a href={profile.github} className={row}>
            <span>{t('contact.github')}</span>
            <ArrowUpRight className="size-4 text-muted" aria-hidden="true" strokeWidth={1.75} />
          </a>
        </li>
        {phone && (
          <li>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className={row}>
              <span>{t('contact.phone')}</span>
              <span className="flex items-center gap-2 text-muted tabular-nums">
                {phone}
                <Phone className="size-4" aria-hidden="true" strokeWidth={1.75} />
              </span>
            </a>
          </li>
        )}
        {cv && (
          <li>
            <a href={cv} download className={row}>
              <span>{t('contact.cv')}</span>
              <Download className="size-4 text-muted" aria-hidden="true" strokeWidth={1.75} />
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

const THINK_MS = 1200;

export default function Output() {
  const t = useT();
  const gen = useGenerate<HTMLDivElement>(THINK_MS);
  const o = useMessages().output;
  return (
    <section id="output" data-stage="output" aria-labelledby="output-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div ref={gen.ref} data-gen={gen.state} className="relative mx-auto grid max-w-6xl gap-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <Thinking block="output" ms={THINK_MS} />
        <div data-stream>
          <header className="relative">
            <span aria-hidden="true" className="ghost-numeral" data-n="04" />
            <h2 id="output-title" className="relative font-display text-3xl leading-[1.05]">{o.title}</h2>
          </header>
          <div className="mt-8 grid max-w-[62ch] gap-4 text-lg leading-relaxed">
            {o.about.map((p, i) => (
              <p key={i} className={i ? 'text-muted' : ''}>{p}</p>
            ))}
          </div>

          <div className="mt-16 grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="text-xl font-medium tracking-tight">{o.experienceTitle}</h3>
              {o.experience.map((e) => (
                <div key={e.role} className="mt-6">
                  <p className="font-medium">{e.role}</p>
                  <p className="text-muted">{e.org}</p>
                  <p className="mt-1 text-sm text-muted">{e.dates}</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
                    {e.points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xl font-medium tracking-tight">{o.educationTitle}</h3>
              <ul className="mt-6 space-y-5">
                {o.education.map((e) => (
                  <li key={e.title}>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-muted">{e.org}</p>
                  </li>
                ))}
              </ul>
              <h3 className="mt-10 text-xl font-medium tracking-tight">{o.languagesTitle}</h3>
              <ul className="mt-4 space-y-1.5 text-muted">
                {o.languages.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* The aside stretches to the column height so Contact can stay sticky once the photo scrolls past. */}
        <aside aria-label={t('contact.title')} className="flex flex-col gap-12">
          <Portrait className="mx-auto max-w-[26rem] lg:max-w-none" />
          <div className="lg:sticky lg:top-28">
            <Contact />
          </div>
        </aside>
      </div>
    </section>
  );
}
