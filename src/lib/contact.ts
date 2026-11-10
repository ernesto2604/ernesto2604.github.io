import profile from '../content/profile.json';

// Messages go through FormSubmit (free, no account): it emails them to the address in the URL with a fixed
// subject. The first one from each site triggers a one-time activation email that has to be confirmed. If it fails
// (it has gone down before), Web3Forms is the backup: same email, keyed by profile.web3formsKey, which is public by
// design. Without JS the form posts to FormSubmit and its thank-you page.
// Used by the contact form (Output.tsx) and by the agent chat.
export const FORM_URL = `https://formsubmit.co/${profile.email}`;
const BACKUP_URL = 'https://api.web3forms.com/submit';
export const SUBJECT = 'Mensaje del Portfolio';
export const MAX_MESSAGE = 2000;

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

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

// `email` is the sender's: both services set it as Reply-To, so replying to the notification answers them.
// Throws when both services fail.
export async function sendMessage(fields: Record<string, unknown> & { message: unknown; email: unknown }) {
  try {
    await post(FORM_URL.replace('formsubmit.co/', 'formsubmit.co/ajax/'), fields);
  } catch (err) {
    if (!profile.web3formsKey) throw err;
    await post(BACKUP_URL, { access_key: profile.web3formsKey, subject: SUBJECT, from_name: 'Portfolio', message: fields.message, email: fields.email });
  }
}
