# alexkirshner.com

Alex Kirshner’s portfolio: video and brand partnerships, selected journalism, Split Zone Duo, and contact. Static HTML, CSS, and JavaScript hosted on GitHub Pages. No build step or production dependencies.

## Preview

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:8000). The October 28 working preview uses port 8897.

## Contact

Visitors choose an inquiry type and click **Email Alex** to open their mail app with the appropriate subject. **Copy email** provides the address for visitors using webmail, with a selectable address fallback if clipboard access is unavailable. The site never submits or stores the inquiry. The no-JavaScript page includes a readable address.

This reduces passive address exposure and avoids a public form-to-email endpoint. It does not promise to prevent scraping, unsolicited email, or unwanted messages sent through an email client.

The mailing list signup has been removed. The page no longer loads its configuration or Turnstile widget. Existing backend files, configuration, and contract tests remain as recovery assets; the live Apps Script deployment and stored addresses have not been changed. See [the archived server setup](server/README.md).

## Files

- `index.html`: content, navigation, contact controls, and search/share metadata.
- `styles.css`: editorial layout, responsive styles, a fixed black-and-white palette, and accessibility affordances.
- `site.js`: local email-draft builder and copy-email action.
- `site-config.js`: dormant public newsletter configuration; not loaded by the page.
- `assets/`: optimized live-show portrait, current video thumbnails, SZD branding, favicon, and share image.
- `tests/signup.test.cjs`: retained Google Apps Script signup contract tests.
- `tests/browser.test.cjs`: real-browser navigation, layout, and contact checks.
- `docs/BUILD-NOTES.md`: goal, content provenance, decisions, checks, and deployment status.

## Checks

The backend checks use Node’s built-in test runner:

```sh
node --test tests/signup.test.cjs
node --check site.js
node --check tests/browser.test.cjs
git diff --check
```

Browser checks require Playwright and a Chromium browser in the development environment. They start and stop their own local server, block external requests, and intercept email drafts, so no email is sent:

```sh
node --test tests/browser.test.cjs
```

Set `NODE_PATH` to an existing Playwright package directory if needed. Set `BROWSER_PATH` to use an installed Chrome executable instead of Playwright’s bundled Chromium. Optionally set `SCREENSHOT_DIR` to capture desktop and mobile previews. These are development tools only; the published website needs none of them.

## Publish

Merging to `main` publishes through the existing GitHub Pages setup at [alexkirshner.com](https://alexkirshner.com/). The revamp is prepared on `codex/portfolio-revamp`; Alex requested keeping the revamp local on October 28; do not push or open a PR without a subsequent request. The CNAME, analytics configuration, and live signup backend are preserved.
