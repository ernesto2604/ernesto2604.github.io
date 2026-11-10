import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import BlurReveal from '../components/ui/BlurReveal';
import ProfileCard from '../components/ui/ProfileCard';
import Row from '../components/ui/Row';
import CvDialog from '../components/CvDialog';
import profile from '../content/profile.json';
import { useMessages, useT } from '../i18n';
import { FORM_URL, MAX_MESSAGE, SUBJECT, sendMessage } from '../lib/contact';

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
      const fields = Object.fromEntries(data);
      await sendMessage({ ...fields, message: fields.message, email: fields.email });
      form.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="mt-6">
        <p className="flex items-center gap-3 text-xl font-medium tracking-tight">
          <Check className="size-6 text-accent" aria-hidden="true" strokeWidth={2} />
          {t('contact.sent')}
        </p>
        <button type="button" onClick={() => setState('idle')} className="ink-auto mt-4 min-h-11 cursor-pointer font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline">
          {t('contact.another')}
        </button>
      </div>
    );
  }

  const field = 'w-full rounded-card border border-line bg-surface px-4 text-base transition-colors duration-200 placeholder:text-muted hover:border-line-strong focus:border-line-strong';
  return (
    <form action={FORM_URL} method="POST" onSubmit={submit} className="mt-6 grid gap-3">
      <input type="hidden" name="_subject" value={SUBJECT} />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label htmlFor="msg" className="text-sm text-muted">{t('contact.formTitle')}</label>
      <textarea id="msg" name="message" required maxLength={MAX_MESSAGE} rows={4} placeholder={t('contact.messagePlaceholder')} className={`${field} resize-y py-3 leading-relaxed`} />
      {/* Named "email" so both services set it as Reply-To: replying to the notification answers the sender. */}
      <label htmlFor="msg-contact" className="mt-2 text-sm text-muted">{t('contact.replyTo')}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="msg-contact" name="email" type="email" autoComplete="email" required maxLength={200} placeholder={t('contact.emailPlaceholder')} className={`${field} h-12 flex-1`} />
        {/* On hover or focus the plane takes off: it bobs, turns and flies right while the label slides out. */}
        <button type="submit" disabled={state === 'sending'} className="send-button flex h-12 cursor-pointer items-center overflow-hidden rounded-2xl bg-accent-fill py-2 pl-[0.9em] pr-5 text-lg font-medium text-accent-ink transition-all duration-200 active:scale-95 disabled:cursor-wait disabled:opacity-70">
          <span className="send-plane flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="origin-center transition-transform duration-300">
              <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
            </svg>
          </span>
          <span className="send-label ml-1 transition-[translate,transform,opacity] duration-300">{state === 'sending' ? t('contact.sending') : t('contact.send')}</span>
        </button>
      </div>
      {state === 'error' && <p role="alert" className="text-sm text-accent">{t('contact.sendError', { email: profile.email })}</p>}
    </form>
  );
}

// The address in plain text, with a one-click copy for people who would rather paste it into their own mail.
function CopyEmail() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* The address is selectable text, so the visitor can still copy it by hand. */
    }
  };
  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="select-all font-mono text-sm">{profile.email}</span>
      <button type="button" onClick={copy} className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 text-muted hover:text-text" aria-label={t('contact.copy')}>
        {copied ? <Check className="size-4" aria-hidden="true" strokeWidth={2} /> : <Copy className="size-4" aria-hidden="true" strokeWidth={1.75} />}
        <span role="status" className="font-mono text-xs uppercase tracking-[0.06em]">{copied ? t('contact.copied') : ''}</span>
      </button>
    </div>
  );
}

function Contact() {
  const t = useT();
  return (
    <div id="contact" className="grid scroll-mt-28 gap-x-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]">
      <div>
        <h3 className={H3}>{t('contact.title')}</h3>
        <p className="mt-6 max-w-[46ch] text-muted">{t('contact.lead')}</p>
        <CopyEmail />
      </div>
      <MessageForm />
    </div>
  );
}

// Column headings in the lower row share one style, so Experience, Education and Let's talk read as one line.
const H3 = 'text-xl font-medium tracking-tight';

// Two rows on wide screens: title and intro beside the card, then Experience rows, then Education | Certificates | Languages,
// then Contact. All share the same 4rem gutter.
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
            <CvDialog />
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
          contactHref="#contact"
        />

        {/* CV table: mono label on the left, content on one shared axis, hairline between rows. */}
        <div className="border-b border-line lg:col-span-full">
          <Row title={o.experienceTitle}>
            {o.experience.map((e) => (
              <div key={e.role}>
                <p className="font-medium">{e.role}</p>
                <p className="text-muted">{e.org} · {e.dates}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
                  {e.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </Row>
          <Row title={o.educationTitle}>
            <ul className="grid gap-x-16 gap-y-6 sm:grid-cols-2">
              {o.education.map((e) => (
                <li key={e.title}>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-muted">{e.org}</p>
                  {e.grade && <p className="text-muted">{e.grade}</p>}
                  <p className="mt-1 text-sm text-muted">{e.dates}</p>
                </li>
              ))}
            </ul>
          </Row>
          <Row title={o.certificatesTitle}>
            {o.certificates.map((c) => (
              <div key={c.title}>
                <p><span className="font-medium">{c.title}</span> <span className="text-muted">· {c.org}</span></p>
                {/* Same mono link as "See all" under the projects. */}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="ink-auto mt-1 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline">
                    {o.credentialLink}
                    <span className="sr-only">: {c.title} {t('a11y.newTab')}</span>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
                  </a>
                )}
              </div>
            ))}
          </Row>
          <Row title={o.languagesTitle}>
            <ul className="grid gap-x-16 gap-y-6 sm:grid-cols-2">
              {o.languages.map((l) => {
                const [name, level] = l.split(' — ');
                return (
                  <li key={l}>
                    <p className="font-medium">{name}</p>
                    <p className="text-muted">{level}</p>
                  </li>
                );
              })}
            </ul>
          </Row>
        </div>

        <aside aria-label={t('contact.title')} className="lg:col-span-full">
          <Contact />
        </aside>
      </div>
    </section>
  );
}
