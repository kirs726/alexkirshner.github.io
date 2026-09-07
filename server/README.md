# Protected signup setup

The frontend deliberately keeps signup unavailable until both settings in `site-config.js` are configured. Do not reuse the old unprotected endpoint. The current live site is unaffected until the new files are published.

This version keeps the existing Google Sheet and its three columns: Timestamp, Email, Bot flag. New submissions must pass server-side Turnstile verification; invalid submissions are rejected, not merely flagged. It also validates email format, prevents spreadsheet formula input, and deduplicates addresses under a script lock. It does not verify mailbox ownership or send confirmation emails. A managed mailing-list service with double opt-in remains an option if Alex wants confirmation emails and sending/unsubscribe management later.

## Activation

1. Create a Cloudflare Turnstile managed widget allowing `alexkirshner.com` and `www.alexkirshner.com`.
2. In the existing sheet, open Extensions → Apps Script. Save a copy of the old script and use `email-signup.gs` from this folder.
3. Set Script Properties: `TURNSTILE_SECRET` to the private secret; `SHEET_NAME` to the actual sheet tab name if it is not `Sheet1`. Never commit the secret.
4. Deploy a new web app version, executing as the owner and accessible to Anyone. Authorize the spreadsheet and external request scopes.
5. Set the new web app URL and public site key in `site-config.js`.
6. Verify a real signup from the allowed domain, confirm exactly one spreadsheet row, and verify a repeated address does not add a second row. Verify missing/invalid tokens add nothing. No real signups were submitted during local testing.
7. Retire all old unprotected web app deployments so bots cannot bypass the protected page. Do not delete the existing sheet or its rows.

The page submits with `fetch` (form-encoded, plus `format=json`) and shows the result inline; the endpoint answers with `ContentService` JSON `{ok, reason}`. Apps Script adds `Access-Control-Allow-Origin: *` only to `ContentService` output, so the JSON path must never switch to `HtmlService`, or the browser will block the response. Without JavaScript the form falls back to normal navigation and the HTML result page. Failure reasons (`missing_secret`, `sheet_not_found`, `verify_failed:<cloudflare codes>`, `wrong_hostname`, `exception:<message>`, and so on) are shown in small text under the form to make misconfiguration diagnosable. Turnstile runs only when signup is configured. Localhost is not allowed in the production handler; use a separate test deployment and Turnstile test keys if integration testing locally.

## Current state (2026-09-07)

Live and verified end to end. The sheet is "Alex Kirshner email list" (tab `Sheet1`; a `Removed` tab holds rows moved out by `cleanupList`). One active deployment, described "Email list", ID beginning `AKfycbzcJCCF`; the four earlier unprotected deployments are archived.

Gotcha hit during setup: after adding `UrlFetchApp` the editor never prompted for the external-request permission, and every request failed with "You do not have permission to call UrlFetchApp.fetch". The fix was listing the scopes explicitly in `appsscript.json` (`spreadsheets.currentonly` and `script.external_request`), then running `checkSetup` to trigger the authorization dialog. Run `checkSetup` from the editor after any configuration change; it verifies the secret against Cloudflare without printing it.

To update the deployed script without changing its URL: paste the new code, then Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy.

Existing addresses have not been cleaned or migrated. Review prior flagged rows separately, retaining a backup before any cleanup.

Official reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
