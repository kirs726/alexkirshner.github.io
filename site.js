(() => {
  const toggle = document.querySelector('#theme-toggle');
  let theme;
  try { theme = localStorage.getItem('theme'); } catch (_) { /* Storage may be unavailable. */ }
  if (theme !== 'dark' && theme !== 'light') theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const applyTheme = () => {
    document.documentElement.dataset.theme = theme;
    toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  };
  applyTheme(); toggle.hidden = false;
  toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'; applyTheme();
    try { localStorage.setItem('theme', theme); } catch (_) { /* Theme still works for this visit. */ }
  });
})();

(() => {
  const form = document.querySelector('#inquiry-form');
  const type = document.querySelector('#inquiry-type');
  const hint = document.querySelector('#inquiry-hint');
  const reveal = document.querySelector('#reveal-email');
  const direct = document.querySelector('#direct-contact');
  const addressLink = document.querySelector('#direct-email');
  const address = ['alex', 'splitzoneduo.com'].join('@');
  const inquiries = {
    partnership: {
      subject: 'Brand partnership inquiry',
      hint: 'The brand, campaign idea, platforms, and any usage plans are helpful.',
      prompts: 'Brand / agency:\r\nCampaign idea:\r\nPlatforms / deliverables:\r\nTiming / budget:\r\nUsage / amplification plans (if any):',
    },
    assignment: {
      subject: 'Writing assignment inquiry',
      hint: 'The publication, story idea, format, and deadline are helpful.',
      prompts: 'Publication:\r\nStory idea / brief:\r\nFormat / length:\r\nDeadline / rate:',
    },
    other: {
      subject: 'Getting in touch',
      hint: 'A few sentences and a relevant link are plenty.',
      prompts: 'I’m getting in touch about:\r\n\r\n',
    },
  };
  const showEmail = () => {
    addressLink.href = `mailto:${address}`;
    addressLink.textContent = address;
    direct.hidden = false;
    reveal.hidden = true;
  };
  const updateHint = () => { hint.textContent = inquiries[type.value]?.hint || inquiries.other.hint; };
  form.hidden = false;
  reveal.hidden = false;
  type.addEventListener('change', updateHint);
  document.querySelectorAll('[data-inquiry]').forEach(link => {
    link.addEventListener('click', () => { type.value = link.dataset.inquiry; updateHint(); });
  });
  reveal.addEventListener('click', () => { showEmail(); addressLink.focus(); });
  document.querySelector('#copy-email').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = 'Email address copied.';
    } catch (_) {
      status.textContent = 'Select the address above to copy it, or click it to open your email app.';
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const inquiry = inquiries[fields.get('type')];
    if (!inquiry) return;
    const body = [
      'Hi Alex,', '', fields.get('message').trim() || inquiry.prompts, '',
      fields.get('name').trim() && `Name: ${fields.get('name').trim()}`,
      fields.get('organization').trim() && `Brand / publication: ${fields.get('organization').trim()}`,
      fields.get('timing').trim() && `Timing / budget: ${fields.get('timing').trim()}`,
    ].join('\r\n');
    const draft = document.createElement('a');
    draft.href = `mailto:${address}?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(body)}`;
    document.body.append(draft);
    draft.click();
    draft.remove();
    showEmail();
    document.querySelector('#inquiry-status').textContent = 'If your email app didn’t open, copy my address and send the details from your usual inbox. Your notes are still here.';
  });
})();

(() => {
  const config = window.SITE_CONFIG || {};
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(config.signupEndpoint || '') || !config.turnstileSiteKey) return;
  const form = document.querySelector('#signup-form');
  const button = document.querySelector('#signup-submit');
  const status = document.querySelector('#signup-status');
  form.action = config.signupEndpoint;
  form.hidden = false;
  document.querySelector('#signup-unavailable').hidden = true;
  const resetState = message => { button.disabled = true; status.textContent = message; };
  let widgetId;
  window.onSignupTurnstileReady = () => {
    widgetId = window.turnstile.render('#turnstile-widget', {
      sitekey: config.turnstileSiteKey,
      action: 'newsletter',
      size: 'compact',
      callback: () => { button.disabled = false; status.textContent = ''; },
      'expired-callback': () => resetState('Please complete the verification again.'),
      'error-callback': () => resetState('Verification could not load. Please refresh or contact me by email.'),
    });
  };
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onSignupTurnstileReady&render=explicit';
  script.async = true;
  script.onerror = () => resetState('Verification could not load. Please refresh or contact me by email.');
  document.head.append(script);
  const buttonLabel = button.innerHTML;
  const failed = (message, reason) => {
    status.classList.remove('is-success');
    status.innerHTML = '';
    status.append(message);
    if (reason) { const code = document.createElement('small'); code.textContent = ` (${reason})`; status.append(code); }
    button.innerHTML = buttonLabel;
    // Turnstile tokens are single-use, so the visitor must verify again before retrying.
    try { window.turnstile.reset(widgetId); } catch (_) { /* Widget may not be rendered. */ }
    button.disabled = true;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.querySelector('[name="cf-turnstile-response"]')?.value) {
      resetState('Please complete the verification first.'); return;
    }
    button.disabled = true;
    button.textContent = 'Subscribing…';
    status.textContent = '';
    const body = new URLSearchParams(new FormData(form));
    body.set('format', 'json');
    try {
      const response = await fetch(config.signupEndpoint, { method: 'POST', body });
      const result = await response.json();
      if (result.ok) {
        form.querySelector('.signup-row').hidden = true;
        form.querySelector('label[for="signup-email"]').hidden = true;
        document.querySelector('#turnstile-widget').hidden = true;
        status.classList.add('is-success');
        status.textContent = result.reason === 'already_subscribed' ? 'You’re already on the list. Thanks!' : 'Thanks! You’re on the list.';
        return;
      }
      failed('Sorry, that didn’t go through. Please try again or email me.', result.reason);
    } catch (_) {
      failed('Sorry, your address couldn’t be sent. Please try again or email me.', 'network');
    }
  });
})();
