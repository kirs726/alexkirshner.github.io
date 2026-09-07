# alexkirshner.com

Alex Kirshner's personal portfolio. A responsive static HTML/CSS/JS site hosted on GitHub Pages, with no build step or dependencies.

## Files

- `index.html`: introduction, menus, writing, podcast, social profiles, signup, contact.
- `styles.css`: responsive layouts, light/dark themes, focus and reduced-motion styles.
- `site.js`: navigation, theme switching, protected signup widget.
- `site-config.js`: public signup configuration. No secrets.
- `server/email-signup.gs`: proposed replacement for the existing Google Apps Script.
- `server/README.md`: signup activation and verification instructions.
- `docs/BUILD-NOTES.md`: decisions, outstanding work, and resume checkpoint.

Preview locally with `python3 -m http.server 8000 --bind 127.0.0.1`. Open http://localhost:8000.

The new signup remains unavailable until configured. Existing spreadsheet records are preserved; no list migration or production deployment has been performed. Video cards currently link to Alex's profiles until featured clips are selected.

Publishing the main branch updates GitHub Pages. Review the launch checklist in `docs/BUILD-NOTES.md` first. The CNAME and existing Cloudflare analytics token are preserved.
