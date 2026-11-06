import { useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import BlurReveal from '../components/ui/BlurReveal';
import ProfileCard from '../components/ui/ProfileCard';
import profile from '../content/profile.json';
import { useMessages, useT } from '../i18n';

// Messages go through FormSubmit (free, no account): it emails them to the address in the URL with a fixed
// subject. The first one from each site triggers a one-time activation email that has to be confirmed. If it fails
// (it has gone down before), Web3Forms is the backup: same email, keyed by profile.web3formsKey, which is public by
// design. Without JS the form posts to FormSubmit and its thank-you page.
const FORM_URL = `https://formsubmit.co/${profile.email}`;
const BACKUP_URL = 'https://api.web3forms.com/submit';
const SUBJECT = 'Mensaje del Portfolio';
const MAX = 2000;

type SendState = 'idle' | 'sending' | 'sent' | 'error';

// Throws unless the service says it sent; the timeout stops a hung service from holding up the backup.
async function post(url: string, fields: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(fields),
    signal: AbortSignal.timeout(10000),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
  if (!res.ok || String(body.success) !== 'true') throw new Error('send failed');
}

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
      const fields = Object.fromEntries(data);
      try {
        await post(FORM_URL.replace('formsubmit.co/', 'formsubmit.co/ajax/'), fields);
      } catch (err) {
        if (!profile.web3formsKey) throw err;
        await post(BACKUP_URL, { access_key: profile.web3formsKey, subject: SUBJECT, from_name: 'Portfolio', message: fields.message, email: fields.email });
      }
      form.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const field = 'w-full rounded-card border border-line bg-surface px-4 text-base transition-colors duration-200 placeholder:text-muted hover:border-line-strong focus:border-line-strong';
  return (
    <form action={FORM_URL} method="POST" onSubmit={submit} className="mt-6 grid gap-3">
      <input type="hidden" name="_subject" value={SUBJECT} />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label htmlFor="msg" className="text-sm text-muted">{t('contact.formTitle')}</label>
      <textarea id="msg" name="message" required maxLength={MAX} rows={4} placeholder={t('contact.messagePlaceholder')} className={`${field} resize-y py-3 leading-relaxed`} />
      {/* Named "email" so both services set it as Reply-To: replying to the notification answers the sender. */}
      <label htmlFor="msg-contact" className="mt-2 text-sm text-muted">{t('contact.replyTo')}</label>
      <input id="msg-contact" name="email" type="email" autoComplete="email" required maxLength={200} placeholder={t('contact.emailPlaceholder')} className={`${field} h-12`} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* On hover or focus the plane takes off: it bobs, turns and flies right while the label slides out. */}
        <button type="submit" disabled={state === 'sending'} className="send-button flex h-12 cursor-pointer items-center overflow-hidden rounded-2xl bg-accent-fill py-2 pl-[0.9em] pr-5 text-lg font-medium text-accent-ink transition-all duration-200 active:scale-95 disabled:cursor-wait disabled:opacity-70">
          <span className="send-plane flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="origin-center transition-transform duration-300">
              <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
            </svg>
          </span>
          <span className="send-label ml-1 transition-[translate,transform,opacity] duration-300">{state === 'sending' ? t('contact.sending') : t('contact.send')}</span>
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
  return (
    <div id="contact" className="scroll-mt-28">
      <h3 className={H3}>{t('contact.title')}</h3>
      <p className="mt-6 max-w-[46ch] text-muted">{t('contact.lead')}</p>
      <MessageForm />
    </div>
  );
}

// Column headings in the lower row share one style, so Experience, Education and Let's talk read as one line.
const H3 = 'text-xl font-medium tracking-tight';

// Two rows on wide screens: title and intro beside the card, then Experience | Education | Contact with their
// headings on one line. The lower grid uses the same 4rem gutter as the outer one, so all three columns are even.
export default function Output() {
  const t = useT();
  const o = useMessages().output;
  return (
    <section id="output" data-stage="output" aria-labelledby="output-title" className="scroll-mt-24 px-5 pb-12 pt-24 sm:px-8 md:pb-16 md:pt-36">
      <div className="relative mx-auto grid max-w-6xl gap-x-16 gap-y-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <header className="relative">
            <span aria-hidden="true" className="ghost-numeral" data-n="03" />
            <h2 id="output-title" className="relative max-w-3xl text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
              <BlurReveal as="span" inView>{o.title}</BlurReveal>
            </h2>
          </header>
          <div className="mt-8 grid max-w-[62ch] gap-4 text-lg leading-relaxed">
            {o.about.map((p, i) => (
              <p key={i} className={i ? 'text-muted' : ''}>{p}</p>
            ))}
          </div>
        </div>

        {/* Left edge on the column line, like every other block. */}
        <ProfileCard
          className="mx-auto lg:mx-0"
          theme="light"
          backdropColor="#F6E2C0"
          avatarUrl={`${profile.photo}-640.webp`}
          name={profile.name}
          title={t('hero.role')}
          handle=""
          status={t('contact.status')}
          statusColor="#1E7547"
          contactText={t('contact.cardButton')}
          contactHref={`mailto:${profile.email}`}
        />

        <div className="grid gap-x-16 gap-y-12 sm:grid-cols-2">
          <div>
            <h3 className={H3}>{o.experienceTitle}</h3>
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
            <h3 className={H3}>{o.educationTitle}</h3>
            <ul className="mt-6 space-y-5">
              {o.education.map((e) => (
                <li key={e.title}>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-muted">{e.org}</p>
                  <p className="text-muted">{e.grade}</p>
                  <p className="mt-1 text-sm text-muted">{e.dates}</p>
                </li>
              ))}
            </ul>
            <h3 className={`mt-10 ${H3}`}>{o.certificatesTitle}</h3>
            <ul className="mt-6 space-y-5">
              {o.certificates.map((c) => (
                <li key={c.title}>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-muted">{c.org}</p>
                  {/* Same mono link as "See all" under the projects. */}
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="ink-auto mt-1 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline">
                      {o.credentialLink}
                      <span className="sr-only">: {c.title} {t('a11y.newTab')}</span>
                      <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <h3 className={`mt-10 ${H3}`}>{o.languagesTitle}</h3>
            <ul className="mt-6 space-y-1.5 text-muted">
              {o.languages.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        </div>

        <aside aria-label={t('contact.title')}>
          <Contact />
        </aside>
      </div>
    </section>
  );
}
