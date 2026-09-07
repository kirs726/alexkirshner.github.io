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
  window.onSignupTurnstileReady = () => {
    window.turnstile.render('#turnstile-widget', {
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
  form.addEventListener('submit', event => {
    if (button.disabled || !form.querySelector('[name="cf-turnstile-response"]')?.value) {
      event.preventDefault(); resetState('Please complete the verification first.'); return;
    }
    button.disabled = true;
    button.textContent = 'Submitting…';
    status.textContent = 'Opening the signup confirmation…';
    // Normal navigation: the server reports success only after the row is saved.
  });
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
})();
