import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Copy, Mail, Send } from 'lucide-react';
import Portrait from '../components/Portrait';
import Thinking, { useGenerate } from '../components/Thinking';
import profile from '../content/profile.json';
import { useMessages, useT } from '../i18n';

// Messages go through FormSubmit (free, no account): it emails them to the address in the URL with a fixed
// subject. The first one triggers a one-time activation email that has to be confirmed. Without JS the form
// still posts to the same service and its thank-you page.
const FORM_URL = `https://formsubmit.co/${profile.email}`;
const SUBJECT = 'Mensaje del Portfolio';
const MAX = 2000;

type SendState = 'idle' | 'sending' | 'sent' | 'error';

function MessageForm() {
  const t = useT();
  const [state, setState] = useState<SendState>('idle');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get('_honey')) return; // bots fill the hidden field
    setState('sending');
    try {
      const res = await fetch(FORM_URL.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
      if (!res.ok || String(body.success) !== 'true') throw new Error('send failed');
      form.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const field = 'w-full rounded-card border border-line bg-surface px-4 text-base transition-colors duration-200 placeholder:text-muted hover:border-line-strong focus:border-line-strong';
  return (
    <form action={FORM_URL} method="POST" onSubmit={submit} className="mt-8 grid gap-3">
      <input type="hidden" name="_subject" value={SUBJECT} />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label htmlFor="msg" className="text-sm text-muted">{t('contact.formTitle')}</label>
      <textarea id="msg" name="message" required maxLength={MAX} rows={4} placeholder={t('contact.messagePlaceholder')} className={`${field} resize-y py-3 leading-relaxed`} />
      <label htmlFor="msg-email" className="sr-only">{t('contact.replyTo')}</label>
      <input id="msg-email" name="email" type="email" autoComplete="email" placeholder={t('contact.replyTo')} className={`${field} h-12`} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" disabled={state === 'sending'} className="inline-flex h-12 items-center gap-2 rounded-full bg-text px-6 font-medium text-bg-0 transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
          <Send className="size-4" aria-hidden="true" strokeWidth={1.75} />
          {state === 'sending' ? t('contact.sending') : t('contact.send')}
        </button>
        <p role="status" className={`text-sm ${state === 'error' ? 'text-accent' : 'text-ok'}`}>
          {state === 'sent' ? t('contact.sent') : state === 'error' ? t('contact.sendError', { email: profile.email }) : ''}
        </p>
      </div>
    </form>
  );
}

function Contact() {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };
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
      <MessageForm />
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
