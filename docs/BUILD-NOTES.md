# Portfolio revamp — October 28, 2026

## Goal

Present Alex Kirshner as an independent writer, podcast host, and video creator whose subject expertise makes him worth commissioning and sponsoring. Give sponsors and editors credible work to evaluate quickly, then a simple way to start a useful email conversation. Use a clean editorial aesthetic with strong type, generous space, restrained color, and actual work.

This revamp supersedes the September layout and introduction recorded in this file’s Git history. Alex explicitly requested a complete redesign and asked the assistant to set the goal. On October 28, he selected “Choose an inquiry type, then email me” as the contact approach.

## Implemented

- One-page, dependency-free site with direct navigation to Video, Writing, Split Zone Duo, and Contact.
- Black background, white text and controls, serif headlines, thin rules, and an existing live-show portrait. No remote fonts, autoplay, embedded social widgets, or scroll-triggered animations.
- Three current, published video examples, including a clearly labeled Chase × SZD paid partnership.
- Dated personal Instagram/TikTok views and shares, with platform and measurement-window context.
- Six writing selections covering sports, public space, and gambling, with publication archives for broader browsing. Some display titles are shortened descriptions rather than verbatim headlines.
- A distinct SZD section connected to both listening and partnership inquiries.
- A compact Contact row with an inquiry dropdown, Email Alex button, and Copy email action. The selected type supplies the email subject; the visitor writes and sends from their mail app. Clipboard failure exposes a selectable address, and a no-JavaScript fallback is available.
- Mailing list signup removed from the page. Existing newsletter backend and public configuration retained as dormant recovery assets. A fixed monochrome palette, keyboard access, reduced-motion support, share metadata, and structured data included.

## Content provenance

Reviewed the existing site; Alex’s SZD editorial and business workspaces, including the October public-facing SZD media kit; the freelance dashboard and published East Potomac assignment brief; the Social Videos strategy, September personal media kit source, and YouTube launch memory; and the connected Kirshner Media Buffer account. Private contracts, rates, finances, draft reporting, and partner economics were not added to the website.

### Current video selections

Verified as published through Buffer `get_post`, including original platform links and matching thumbnail assets, October 28, 2026:

- [Wake Forest–Cal](https://www.instagram.com/reel/Dej1MmVjrfu/) — October 16.
- [Chase × Split Zone Duo: budgeting college football fandom](https://www.instagram.com/reel/DePa5mAyfqV/) — October 8. Original caption explicitly identifies `#Ad #ChasePartner`.
- [The wildest stat line in CFB history](https://www.instagram.com/p/Deo3oCygNqY/) — October 18. Alex selected this clip and supplied “APPRECIATING THE SPORT'S ODDITY” and the display title. Buffer confirms the matching Reel shortcode, original Army-football caption, and thumbnail.

The older thumbnails and clips remain in the repository for recovery; the new page references only the verified current selections. No new use of third-party editorial photography was introduced.

### Audience snapshot

Source: live Buffer `get_aggregated_post_metrics` for Kirshner Media’s personal Instagram and TikTok channels, pulled October 28, 2026. Cohort: posts published from September 28, 2026, 00:00 Pacific through October 28, 2026, 00:00 Pacific (September 28–October 27 inclusive). These are accumulated metrics on that post cohort, not a claim that every play happened during the window.

| Platform | Views | Shares | Posts |
| --- | ---: | ---: | ---: |
| Instagram | 3,249,349 | 36,152 | 118 |
| TikTok | 1,458,281 | 6,440 | 53 |
| Combined | 4,707,630 | 42,592 | 171 |

Queried the combined cohort and each platform separately; the totals reconcile. Website displays 4.7M views and 42K+ shares. Includes all qualifying post types reported by Buffer; do not relabel as Reels-only. Views are not unique people, and cross-platform audiences are not deduplicated. Instagram data last updated October 28 at 21:31 UTC; TikTok data last updated October 28 at 05:19 UTC. The dated snapshot is intentionally static and makes no reach guarantee. Refresh the query and the date together when updating.

### Writing and other links

The October Slate story’s publication and URL are confirmed in Alex’s freelance records. Existing writing links were retained; The Ringer’s current headline was checked and updated. GQ’s article and author page were checked publicly. Slate and The Athletic restrict automated access, so this run does not claim a fresh human review of all publisher pages. The verified YouTube handle is [@alex_kirshner](https://www.youtube.com/@alex_kirshner), confirmed by the launch records and matching Buffer channel ID.

## Verification — original revamp

- Existing backend suite: 27 tests passed before and after the work.
- Browser suite: 16 checks passed, including responsive navigation and image loading at 320, 390, 700, 768, 1024, 1440, and 1920 pixels; no page-wide horizontal overflow. Video rail intentionally scrolls horizontally on phones.
- All inquiry types tested, including Unicode, ampersands, multiline ideas, optional details, fixed subjects, and no HTTP form submission. A regression test first demonstrated that the earlier required details prevented the desired type-only email path, then passed after the change.
- Direct email reveal and denied-clipboard fallback, compatibility with an earlier saved light-mode preference, keyboard disclosure control, anchor targets, control labels, structured data, and no-JavaScript contact tested.
- Newsletter success and rejection tested in the browser against mocked services; real backend contract checked by the unchanged server tests. No real signup or email was sent, and the production Apps Script was not changed. The client now explicitly requests Cloudflare’s supported compact widget size so a real challenge fits the narrowest layout.
- The original light/dark palette was checked before this revision; the requested monochrome palette is checked in the current browser tests and visual preview. Reduced-motion mode disables smooth scrolling.
- JavaScript syntax and Git whitespace checks run. No lint/typecheck command or build step is configured for this static project.
- Browser screenshots visually inspected. Local user-facing copies are kept in ignored `output/previews/`.

## Review and delivery

Implementation used the Compound Engineering work workflow. A separate simplification review removed a no-op JavaScript filter, an unused CSS selector, and a redundant responsive rule; no new abstraction or runtime dependency was needed. A completed five-lens code review (correctness, security, adversarial, testing, maintainability) returned no actionable findings. Receipt: run `portfolio-20261028-01a184aa`. The proposed external Claude review was rejected by automatic approval review before launch because the user had not explicitly authorized that transfer; local reviewers completed the review and no external review job started.

The review identified a Turnstile-mock footprint coverage gap. A dimensionally faithful fixture based on [Cloudflare’s widget-size documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) reproduced a challenge extending into the gutter at 320px. Explicit compact sizing fixed it; the regression now checks section bounds at 320px, 390px, 768px, and desktop, including resize. Real mail-client launch and production challenge validation remain outside local coverage. The source receipt is in the local temporary review directory; these notes retain the durable outcome.

## Deployment

The working preview runs at http://127.0.0.1:8897. Alex explicitly requested keeping the revamp local on October 28. No branch push or PR is authorized; publication requires a subsequent instruction. Production remains on the prior site. Keep the existing `CNAME`, dormant public signup configuration, and Cloudflare analytics token.

## Alex’s copy and monochrome revision — October 28

Replaced the hero heading/bio, sponsorship paragraph, and SZD description with Alex’s supplied wording. Removed the extra video/writing introductions, story blurbs, photo caption, and contact sales copy. Kept the 4.7M views, 42K+ shares, source window, work links, and inquiry flow. Removed the light/dark switch so the page stays black and white regardless of older saved preferences; the SZD logo renders white through CSS, while actual photos and video thumbnails retain their colors. The favicon, share metadata, and share image match the revised design.

Removed the Slate AI-icons article and made [the Oregon column](https://www.nytimes.com/athletic/7724389/2026/10/26/dan-lanning-oregon-wasted-season/) the first selection. Alex supplied the published Athletic PDF, whose first page verifies the exact headline, Alex’s byline, October 26, 2026 date, and matching URL. The PDF is source material only; it is not copied into public assets.

Revised browser coverage for the fixed palette and retained keyboard-disclosure checks. The 16 browser checks and 27 backend checks all pass. The site remains local.

## Video selection and section headings — October 28

Alex selected Wake Forest–Cal, the Chase partnership, and the Army stat-line video, in that order. The third card uses his exact label “APPRECIATING THE SPORT'S ODDITY” and title “The wildest stat line in CFB history.” Its matching published thumbnail was verified through Buffer and saved locally.

The video introduction uses Alex’s supplied paragraph beginning “I make a lot of Instagram Reels and TikToks.” Video and writing now use their uppercase section labels as the actual headings, without a second headline underneath. Social links and the commissioning link remain available. All changes remain local.

## Contact simplification — October 28

At Alex’s request, removed the mailing list section, signup frontend, configuration script loading, and Turnstile widget. The backend, configuration file, and signup contract tests remain available for recovery; no remote deployment or subscriber data was changed.

Replaced the two-column contact form with one Contact heading and three controls: inquiry type, Email Alex, and Copy email. Removed optional fields, duplicate email reveal, and explanatory paragraphs. The sponsorship and commissioning links still preselect the relevant inquiry. Email opens with the selected subject and no prewritten body. Copy feedback uses a quiet live status; clipboard failure shows a usable address. On phones the dropdown sits above the two actions. Also removed “Views include repeat plays.” from the audience source note as requested; the view/share figures and source dates remain.

Browser coverage now matches the simpler contact flow, including all three subjects, required inquiry selection, copying, denied-clipboard fallback, responsive layout, and no-JavaScript contact. All 14 browser checks and 27 retained backend checks pass. JavaScript syntax and Git whitespace checks pass, and desktop/phone contact screenshots were visually inspected. Historical signup UI checks above describe the original revamp and are superseded by this revision. All work stays local.

## Mobile layout pass — October 28

Gave phones a two-row header so the navigation stays on one line with larger tap targets. Replaced the horizontal video rail with three complete thumbnail-and-title rows, kept the paid partnership label visible, and moved writing-row arrows alongside publication/date metadata so headlines use the full width. Increased body-copy readability, reduced the decorative SZD artwork height, and arranged footer links in a simple two-column grid. Contact retains the dropdown above Email Alex and Copy email. These layout changes apply at 700px and below.

Capitalized the October 2026 Slate selection as “Trump’s War on the People’s Golf Course.” Changed the Athletic entry’s visible and machine-readable dates to October 2026, matching the other writing selections; the source article’s exact publication date remains documented above.

All 14 browser checks pass across nine widths from 320px to 1920px. The responsive check now verifies mobile tap-target height, single-line navigation, and complete video cards within the viewport. Visually inspected narrow-phone navigation, video rows, writing, podcast/contact spacing, and the tablet transition. Updated local screenshots are in ignored `output/previews/`. Nothing was pushed or published.
