const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
let server, browser, context, page, url;
const errors = [];
// Cloudflare's documented compact/normal footprints keep layout checks faithful to the embed.
// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/
const turnstile = `window.turnstile = {
  render(selector, options) {
    window.challengeOptions = options;
    const footprint = document.createElement('div');
    footprint.className = 'turnstile-layout-fixture';
    footprint.style.width = options.size === 'compact' ? '150px' : '300px';
    footprint.style.height = options.size === 'compact' ? '140px' : '65px';
    document.querySelector(selector).append(footprint);
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = 'cf-turnstile-response'; input.value = 'test-token';
    document.querySelector(selector).append(input);
    options.callback(); return 'test-widget';
  },
  reset() { document.querySelector('[name="cf-turnstile-response"]').value = ''; }
}; window.onSignupTurnstileReady();`;

before(async () => {
  server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!filename.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    try {
      const body = await fs.readFile(filename);
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
beforeEach(async () => {
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await context.route('https://**/*', route => {
    if (route.request().url().startsWith('https://challenges.cloudflare.com/')) return route.fulfill({ contentType: 'text/javascript', body: turnstile });
    return route.abort();
  });
  page = await context.newPage();
  errors.length = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => !document.querySelector('#inquiry-form').hidden);
  await page.evaluate(() => {
    window.emailDrafts = [];
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="mailto:"]');
      if (link) { event.preventDefault(); window.emailDrafts.push(link.href); }
    });
  });
});
afterEach(async () => { await context.close(); });

test('navigation and assets work at phone, tablet, and desktop widths', async () => {
  for (const width of [320, 390, 700, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `page overflow at ${width}px`);
    for (const link of await page.locator('nav a').all()) {
      await link.click();
      assert.equal(new URL(page.url()).hash, await link.getAttribute('href'));
    }
  }
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
    assert.ok(await img.evaluate(el => el.naturalWidth > 0));
  }
  assert.deepEqual(errors, []);
});

test('sponsor and editor links select the relevant inquiry and guidance', async () => {
  await page.getByRole('link', { name: 'Discuss a partnership' }).click();
  assert.equal(await page.locator('#inquiry-type').inputValue(), 'partnership');
  assert.match(await page.locator('#inquiry-hint').textContent(), /platforms/);
  await page.getByRole('link', { name: 'Commission a story' }).click();
  assert.equal(await page.locator('#inquiry-type').inputValue(), 'assignment');
  assert.match(await page.locator('#inquiry-hint').textContent(), /deadline/);
});

test('verification widget fits inside the newsletter section on narrow phones and resize', async () => {
  for (const width of [1440, 320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    const fits = await page.evaluate(() => {
      const widget = document.querySelector('.turnstile-layout-fixture').getBoundingClientRect();
      const section = document.querySelector('.signup-section').getBoundingClientRect();
      return widget.left >= section.left && widget.right <= section.right;
    });
    assert.equal(fits, true, `verification widget exceeds newsletter bounds at ${width}px`);
  }
});

test('inquiry validation stops incomplete drafts', async () => {
  await page.locator('#inquiry-form button[type="submit"]').click();
  assert.deepEqual(await page.evaluate(() => window.emailDrafts), []);
  assert.equal(await page.locator('#inquiry-type').evaluate(el => el.validity.valueMissing), true);
});

test('choosing only an inquiry type opens an email draft with relevant prompts', async () => {
  await page.locator('#inquiry-type').selectOption('partnership');
  await page.locator('#inquiry-form button[type="submit"]').click();
  const drafts = await page.evaluate(() => window.emailDrafts);
  assert.equal(drafts.length, 1);
  const draft = new URL(drafts[0]);
  assert.equal(draft.searchParams.get('subject'), 'Brand partnership inquiry');
  assert.match(draft.searchParams.get('body'), /Campaign idea:/);
  assert.match(draft.searchParams.get('body'), /Timing \/ budget:/);
});

for (const [type, subject] of [['partnership', 'Brand partnership inquiry'], ['assignment', 'Writing assignment inquiry'], ['other', 'Getting in touch']]) {
  test(`${type} creates a correctly encoded email draft without a web submission`, async () => {
    const requests = [];
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    await page.locator('#inquiry-type').selectOption(type);
    await page.locator('.inquiry-details summary').click();
    await page.locator('#inquiry-name').fill('Sam & Jo');
    await page.locator('#inquiry-organization').fill('A&B Studio');
    await page.locator('#inquiry-message').fill('Let’s discuss sports & culture.\nhttps://example.com/?a=1&b=2');
    await page.locator('#inquiry-timing').fill('November / $5,000');
    await page.locator('#inquiry-form button[type="submit"]').click();
    const drafts = await page.evaluate(() => window.emailDrafts);
    assert.equal(drafts.length, 1);
    const draft = new URL(drafts[0]);
    assert.equal(draft.pathname, 'alex@splitzoneduo.com');
    assert.equal(draft.searchParams.get('subject'), subject);
    assert.match(draft.searchParams.get('body'), /Sam & Jo/);
    assert.match(draft.searchParams.get('body'), /https:\/\/example.com\/\?a=1&b=2/);
    assert.match(draft.searchParams.get('body'), /November \/ \$5,000/);
    assert.equal(draft.searchParams.has('bcc'), false);
    assert.equal(requests.some(request => request.method === 'POST'), false);
    assert.equal(new URL(page.url()).search, '');
    assert.equal(await page.locator('#direct-contact').isVisible(), true);
    assert.match(await page.locator('#inquiry-status').textContent(), /If your email app didn’t open/);
    assert.match(await page.locator('#inquiry-message').inputValue(), /Let’s discuss/);
  });
}

test('direct email and copy failure fallback remain usable', async () => {
  assert.equal(await page.locator('a[href^="mailto:"]').count(), 0);
  await page.getByRole('button', { name: 'Just need my email?' }).click();
  assert.equal(await page.locator('#direct-email').getAttribute('href'), 'mailto:alex@splitzoneduo.com');
  assert.equal(await page.locator('#direct-email').evaluate(el => el === document.activeElement), true);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(Error('Denied')) }, configurable: true }));
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#copy-status').textContent.includes('Select the address'));
});

test('theme preference survives reload and publication list is keyboard accessible', async () => {
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  const summary = page.locator('.publication-list summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.publication-list').getAttribute('open'), '');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.publication-list').getAttribute('open'), null);
  assert.deepEqual(errors, []);
});

test('unavailable local storage does not break contact or theme controls', async () => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw Error('Unavailable'); } }); });
  await page.reload();
  assert.equal(await page.locator('#inquiry-form').isVisible(), true);
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.deepEqual(errors, []);
});

test('newsletter saves through the protected endpoint and reports success', async () => {
  let submitted;
  await context.route('https://script.google.com/**', async route => {
    submitted = new URLSearchParams(route.request().postData());
    await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, reason: 'saved' }) });
  });
  await page.locator('#signup-email').fill('reader@example.com');
  await page.getByRole('button', { name: 'Subscribe', exact: false }).click();
  await page.waitForFunction(() => document.querySelector('#signup-status').textContent.includes('You’re on the list'));
  assert.equal(submitted.get('email'), 'reader@example.com');
  assert.equal(submitted.get('cf-turnstile-response'), 'test-token');
  assert.equal(submitted.get('format'), 'json');
  assert.equal(await page.locator('.signup-row').isVisible(), false);
});

test('newsletter failure retains the address and requires new verification', async () => {
  await context.route('https://script.google.com/**', route => route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, reason: 'verify_failed' }) }));
  await page.locator('#signup-email').fill('reader@example.com');
  await page.getByRole('button', { name: 'Subscribe', exact: false }).click();
  await page.waitForFunction(() => document.querySelector('#signup-status').textContent.includes('didn’t go through'));
  assert.equal(await page.locator('#signup-email').inputValue(), 'reader@example.com');
  assert.equal(await page.locator('#signup-submit').isDisabled(), true);
  assert.equal(await page.locator('[name="cf-turnstile-response"]').inputValue(), '');
});

test('without JavaScript, work and a readable email contact remain available', async () => {
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  await noScript.route('https://**/*', route => route.abort());
  const plain = await noScript.newPage();
  await plain.goto(url);
  assert.equal(await plain.locator('.story-list a').count(), 6);
  assert.equal(await plain.locator('.video-card').count(), 3);
  assert.equal(await plain.locator('noscript p').isVisible(), true);
  assert.match(await plain.locator('noscript p').textContent(), /alex \[at\] splitzoneduo \[dot\] com/);
  assert.equal(await plain.locator('#inquiry-form').isVisible(), false);
  await noScript.close();
});

test('metadata, anchor targets, and control labels are complete', async () => {
  const issues = await page.evaluate(() => {
    const failures = [];
    for (const link of document.querySelectorAll('a[href^="#"]')) if (!document.getElementById(link.hash.slice(1))) failures.push(`Missing anchor ${link.hash}`);
    for (const input of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) if (!input.labels.length) failures.push(`Missing label ${input.id}`);
    for (const img of document.images) if (!img.hasAttribute('alt')) failures.push('Missing image alt');
    const data = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    if (data.name !== 'Alex Kirshner') failures.push('Incorrect structured data');
    return failures;
  });
  assert.deepEqual(issues, []);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://alexkirshner.com/');
});

test('optional screenshots capture fully loaded desktop, mobile, and dark mode', async () => {
  if (!process.env.SCREENSHOT_DIR) return;
  await fs.mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
  for (const [name, width, theme] of [['desktop', 1440, 'light'], ['mobile', 390, 'light'], ['dark', 1440, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(el => el.decode()); }
    await page.evaluate(() => { document.querySelector('.video-grid').scrollLeft = 0; scrollTo(0, 0); });
    await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${name}.png`), fullPage: true });
  }
});
