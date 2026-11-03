/**
 * Demo form. Two modes:
 *  - mailto (default): opens the visitor's email app with the details filled in.
 *  - endpoint: posts to a form service (e.g. Formspree) set in site.json.
 * All values are only ever placed in text or URL-encoded, never as HTML.
 */
export function initDemoForm() {
  const form = document.getElementById('demoForm') as HTMLFormElement | null;
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  const status = form.querySelector<HTMLElement>('.form-status')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get('_gotcha') || '')) return; // bot

    const get = (k: string) => String(data.get(k) || '').trim();
    if (!/^https:\/\/\S+$/.test(get('link'))) {
      status.textContent = 'Please use a link that starts with https://';
      return;
    }

    if (form.dataset.mode === 'endpoint') {
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.textContent = 'Thank you. Your demo is with us, and we reply within two working days.';
      } catch {
        status.textContent = `Something went wrong. Please email ${form.dataset.email} instead.`;
      } finally {
        button.disabled = false;
      }
      return;
    }

    const body = [
      `Name: ${get('name')}`,
      `Email: ${get('email')}`,
      `Artist: ${get('artist')}`,
      `City: ${get('city')}`,
      `Music: ${get('link')}`,
      '',
      get('message'),
    ].join('\n');
    const subject = `Demo: ${get('artist') || get('name')}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open now. Press send there to finish.';
  });
}
