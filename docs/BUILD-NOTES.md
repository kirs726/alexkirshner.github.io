# Portfolio redesign checkpoint

## Approved direction

Alex selected layout B: introduction and vertical video side by side on desktop, then selected writing and the podcast. Mobile stacks those sections. Navigation must be Writing, Podcasting, Video. Intro must read exactly:

> I write about sports and non-sports. I co-host Split Zone Duo, a national college football podcast, and I spend lots of time making social media connections.

No new Substack. A simple signup with stronger spam protection is required.

## Implemented locally

- Responsive static HTML/CSS/JS, with no build framework.
- Tap/click native dropdowns, keyboard Escape dismissal, outside-click dismissal, visible focus styles.
- Existing six selected writing clips retained; publisher author links added.
- Split Zone Duo episode/archive, about, subscription and sponsorship links.
- Direct email contact instead of the old client-filtered contact form.
- Light/dark theme with saved preference and reduced-motion support.
- Social profile cards are honest links to Instagram/TikTok, not fabricated video thumbnails.
- Signup frontend and a protected Google Apps Script replacement; setup in server/README.md.

## Still needed before launch

- ~~Alex's chosen video URLs~~ Done 2026-09-06: four clips (2 Instagram, 2 TikTok) as thumbnail cards in a scroll-snap row, thumbnails saved locally under `assets/video-thumbs/`, each card links to the original post.
- ~~Turnstile public key and server secret configuration, deployment of the protected Apps Script~~ Done 2026-09-07: widget created, protected script deployed, `site-config.js` populated. Deployment verified public (GET returns the script's failure page). Still open: real end-to-end signup check on the live domain (Turnstile rejects localhost), then retirement of the old unprotected Apps Script deployments.
- Publisher author URLs that block automated access need human verification.
- Live deployment is not yet performed. Original Google sheet and production Apps Script are untouched.

## Resume

Review `git diff`, `site-config.js`, and `server/README.md`. The working site is at repo root. Earlier disposable sketches live under `/tmp/portfolio-layout-comparison`; they are not production files. Update these notes with validation results before stopping.

## Validation checkpoint

- `git diff --check`, JavaScript syntax checks passed.
- `node --test tests/signup.test.cjs`: 10 tests passed, covering success, invalid email, honeypot, missing/failed tokens, wrong hostname/action, formula input, storage failure, and deduplication. These mock Google services; deployment integration remains untested.
- Browser checked at 1280px desktop and 390px/320px mobile. No horizontal page overflow at the mobile widths. Verified opening menus, single-open behavior, Escape dismissal, outside-click dismissal, and theme switching.
- Local build preview: http://localhost:50744 (Python server; restart using README command if needed).

## SZD branding update

Used the yellow SZD wordmark and green/yellow/black palette from the supplied local media kit. Alex supplied the copy “Reaching 15,000 downloaders per episode.” The card now explicitly offers podcast and social media partnerships together, with a combined email inquiry link. The media-kit site and its other contents were not published or modified.
