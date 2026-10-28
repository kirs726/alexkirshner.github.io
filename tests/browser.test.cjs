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
  await context.route('https://**/*', route => route.abort());
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

test('sponsor and editor links select the relevant inquiry', async () => {
  await page.getByRole('link', { name: 'Discuss a partnership' }).click();
  assert.equal(await page.locator('#inquiry-type').inputValue(), 'partnership');
  await page.getByRole('link', { name: 'Commission a story' }).click();
  assert.equal(await page.locator('#inquiry-type').inputValue(), 'assignment');
});

test('inquiry validation stops incomplete drafts', async () => {
  await page.locator('#inquiry-form button[type="submit"]').click();
  assert.deepEqual(await page.evaluate(() => window.emailDrafts), []);
  assert.equal(await page.locator('#inquiry-type').evaluate(el => el.validity.valueMissing), true);
});

for (const [type, subject] of [['partnership', 'Brand partnership inquiry'], ['assignment', 'Writing assignment inquiry'], ['other', 'Getting in touch']]) {
  test(`${type} opens an email with the selected subject and no web submission`, async () => {
    const requests = [];
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    await page.locator('#inquiry-type').selectOption(type);
    await page.getByRole('button', { name: 'Email Alex', exact: true }).click();
    const drafts = await page.evaluate(() => window.emailDrafts);
    assert.equal(drafts.length, 1);
    const draft = new URL(drafts[0]);
    assert.equal(draft.pathname, 'alex@splitzoneduo.com');
    assert.equal(draft.searchParams.get('subject'), subject);
    assert.equal(draft.searchParams.has('bcc'), false);
    assert.equal(requests.some(request => request.method === 'POST'), false);
    assert.equal(new URL(page.url()).search, '');
    assert.deepEqual(errors, []);
  });
}

test('Copy email copies the address and provides quiet feedback', async () => {
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async value => { window.copiedAddress = value; } }, configurable: true,
  }));
  await page.getByRole('button', { name: 'Copy email', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#contact-status').textContent.includes('copied'));
  assert.equal(await page.evaluate(() => window.copiedAddress), 'alex@splitzoneduo.com');
  assert.equal(await page.locator('#contact-status').isVisible(), true);
  assert.deepEqual(await page.evaluate(() => window.emailDrafts), []);
});

test('denied clipboard access shows a usable address fallback', async () => {
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.reject(Error('Denied')) }, configurable: true,
  }));
  await page.getByRole('button', { name: 'Copy email', exact: true }).click();
  const address = page.locator('#contact-status a');
  await address.waitFor({ state: 'visible' });
  assert.equal(await address.textContent(), 'alex@splitzoneduo.com');
  assert.equal(await address.getAttribute('href'), 'mailto:alex@splitzoneduo.com');
});

test('publication list is keyboard accessible', async () => {
  const summary = page.locator('.publication-list summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.publication-list').getAttribute('open'), '');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.publication-list').getAttribute('open'), null);
  assert.deepEqual(errors, []);
});

test('black-and-white presentation overrides earlier light-mode preferences', async () => {
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload();
  assert.equal(await page.locator('#inquiry-form').isVisible(), true);
  const colors = await page.locator('body').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, text: getComputedStyle(el).color }));
  assert.deepEqual(colors, { background: 'rgb(0, 0, 0)', text: 'rgb(255, 255, 255)' });
  assert.equal(await page.locator('#theme-toggle').count(), 0);
  assert.deepEqual(errors, []);
});

test('contact has no signup, optional fields, or verification widget', async () => {
  assert.equal(await page.locator('.signup-section, #signup-form').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Subscribe', exact: false }).count(), 0);
  assert.equal(await page.locator('#inquiry-form select').count(), 1);
  assert.equal(await page.locator('#inquiry-form input, #inquiry-form textarea').count(), 0);
  assert.equal(await page.locator('#inquiry-form button').count(), 2);
  assert.equal(await page.locator('script[src*="turnstile"], script[src*="site-config"]').count(), 0);
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

test('optional screenshots capture fully loaded desktop and mobile', async () => {
  if (!process.env.SCREENSHOT_DIR) return;
  await fs.mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
  for (const [name, width] of [['desktop', 1440], ['mobile', 390]]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(el => el.decode()); }
    await page.evaluate(() => { document.querySelector('.video-grid').scrollLeft = 0; scrollTo(0, 0); });
    await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${name}.png`), fullPage: true });
    await page.locator('#contact').screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `contact-${name}.png`) });
  }
});
