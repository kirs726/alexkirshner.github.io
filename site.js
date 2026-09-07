(() => {
  const menus = [...document.querySelectorAll('.nav-menu')];
  menus.forEach(menu => {
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) menu.open = false; });
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-menu')) menus.forEach(menu => { menu.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') menus.forEach(menu => {
      if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  });
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
