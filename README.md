# alexkirshner.com

Personal portfolio site for Alex Kirshner — writer, podcast host, co-founder of Split Zone Duo. Hosted on GitHub Pages at [alexkirshner.com](https://alexkirshner.com).

## What it is

A single-page static site (plain HTML/CSS/JS, no framework) with:

- Bio and headshot
- Email signup form
- Podcast section (Split Zone Duo)
- Selected writing clips
- Contact form
- Social links
- Dark mode toggle

## Email signup

The email capture form at the top of the page posts to a Google Apps Script web app, which appends rows to a Google Sheet. No email notifications — signups just accumulate in the spreadsheet.

The form is intentionally frictionless (no CAPTCHA, no math challenge). Instead, hidden fields help identify bots after the fact:

- **Honeypot fields**: hidden inputs that bots fill but humans never see
- **Timestamp**: records when the page loaded, so submissions within seconds of load can be flagged

The Apps Script writes three columns: timestamp, email, and a bot flag (empty for clean signups, descriptive text for suspicious ones). The source script lives at `~/email-signup.gs`.

## Contact form

The contact form uses [FormSubmit.co](https://formsubmit.co) and has heavier bot protection: honeypot fields, timing checks, interaction tracking, a math challenge, spam pattern matching, and disposable email blocking.

## Hosting

- GitHub Pages from the `main` branch of this repo
- Custom domain via CNAME record
- Cloudflare Web Analytics for traffic tracking

## Recent changes (April 2026)

- Removed Hang Up and Listen podcast section (show is ending)
- Added email signup form at top of page, backed by Google Sheets via Apps Script
- Chose a low-friction approach to email capture: no gates for users, hidden signals for bot detection after the fact
