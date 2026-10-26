// Homepage contact form: inline validation, spam guards, and the sending / success / error states.
// The endpoint comes from the form's data-endpoint (profile.contactEndpoint). Empty means the
// backend is not connected yet, so submitting points people to email instead.
// The request is a "simple" text/plain POST (no custom headers) so Google Apps Script accepts it
// cross-origin without a preflight.
import { isPaused } from './motion';

const MIN_FILL_MS = 3000;
const TIMEOUT_MS = 25000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MSG = {
  failed: 'Couldn’t send just now. You can email me instead:',
  offline: 'The form isn’t connected yet. Please email me.',
};

type Field = HTMLInputElement | HTMLTextAreaElement;

const rules: Record<string, (v: string) => string> = {
  name: (v) => (v ? '' : 'Please add your name.'),
  email: (v) => (!v ? 'Please add your email.' : EMAIL_RE.test(v) ? '' : 'That email doesn’t look right.'),
  message: (v) =>
    !v
      ? 'Please tell me a little about the task.'
      : v.length < 20
        ? 'At least 20 characters, please.'
        : v.length > 2000
          ? 'Please keep it under 2000 characters.'
          : '',
};

const form = document.querySelector<HTMLFormElement>('#contact-form');
if (form) init(form);

function init(form: HTMLFormElement) {
  const startedAt = Date.now();
  const el = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
  const fields = ['name', 'email', 'message'].map((n) => form.elements.namedItem(n) as Field);
  const honeypot = form.elements.namedItem('company') as HTMLInputElement;
  (form.elements.namedItem('startedAt') as HTMLInputElement).value = String(startedAt);
  const send = el<HTMLButtonElement>('.send-key', form);
  const alert = el<HTMLElement>('#contact-alert');
  const alertText = el<HTMLElement>('.alert-text', alert);
  const count = el<HTMLElement>('.field-count', form);
  const done = el<HTMLElement>('.contact-done');
  const touched = new Set<Field>();
  let sending = false;

  const check = (f: Field) => {
    const error = rules[f.name](f.value.trim());
    const msg = document.getElementById(`${f.id}-error`);
    if (msg) msg.textContent = error;
    if (error) f.setAttribute('aria-invalid', 'true');
    else f.removeAttribute('aria-invalid');
    return !error;
  };

  const updateCount = () => {
    const field = fields[2];
    count.textContent = `${field.value.length} / 2000`;
  };

  for (const f of fields) {
    f.addEventListener('blur', () => {
      if (f.value.trim() || touched.has(f)) {
        touched.add(f);
        check(f);
      }
    });
    f.addEventListener('input', () => {
      if (touched.has(f)) check(f);
      if (f.name === 'message') updateCount();
    });
  }
  updateCount();

  const showAlert = (text: string) => {
    alertText.textContent = '';
    alert.hidden = false;
    // Set the text on the next frame so a repeated message is announced again.
    requestAnimationFrame(() => (alertText.textContent = text));
  };

  const setSending = (on: boolean) => {
    sending = on;
    send.textContent = on ? 'Sending…' : 'Send it';
    if (on) send.setAttribute('aria-disabled', 'true');
    else send.removeAttribute('aria-disabled');
    form.setAttribute('aria-busy', String(on));
  };

  const showSuccess = () => {
    form.hidden = true;
    done.hidden = false;
    el<HTMLElement>('.cd-title', done).focus();
    const lines = [...done.querySelectorAll<HTMLElement>('.cd-steps li')];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || isPaused()) return;
    lines.forEach((l) => (l.style.visibility = 'hidden'));
    lines.forEach((l, i) => setTimeout(() => (l.style.visibility = ''), 350 + i * 450));
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (sending) return;
    alert.hidden = true;
    fields.forEach((f) => touched.add(f));
    const invalid = fields.filter((f) => !check(f));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    const endpoint = (form.dataset.endpoint ?? '').trim();
    if (!endpoint) return showAlert(MSG.offline);
    // Spam guards (the server checks both again): a filled honeypot or an instant submit is a bot.
    if (honeypot.value || Date.now() - startedAt < MIN_FILL_MS) return showAlert(MSG.failed);

    const [name, email, message] = fields.map((f) => f.value.trim());
    const payload = {
      name,
      email,
      message,
      company: honeypot.value,
      startedAt,
      elapsedMs: Date.now() - startedAt,
      page: location.pathname,
      userAgent: navigator.userAgent,
    };
    setSending(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const data = res.ok ? ((await res.json()) as { ok?: boolean }) : null;
      if (!data?.ok) throw new Error('not ok');
      setSending(false);
      showSuccess();
    } catch {
      setSending(false);
      showAlert(MSG.failed);
    } finally {
      clearTimeout(timer);
    }
  });

  // Copy-to-clipboard for the email fallback, with a select-and-copy fallback.
  const copy = document.querySelector<HTMLButtonElement>('.copy-key');
  const copyStatus = document.querySelector<HTMLElement>('.copy-status');
  const mailLink = document.querySelector<HTMLElement>('.fallback-mail');
  let copyTimer = 0;
  copy?.addEventListener('click', async () => {
    const text = copy.dataset.copy ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      if (mailLink) {
        const range = document.createRange();
        range.selectNodeContents(mailLink);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        }
      }
    }
    if (!ok) {
      if (copyStatus) copyStatus.textContent = 'Email address selected. Press Control or Command C to copy.';
      return;
    }
    copy.classList.add('is-copied');
    if (copyStatus) copyStatus.textContent = 'Email address copied.';
    clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      copy.classList.remove('is-copied');
      if (copyStatus) copyStatus.textContent = '';
    }, 2000);
  });
}
