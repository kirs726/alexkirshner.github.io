# Portfolio revamp — October 28, 2026

## Goal

Present Alex Kirshner as an independent writer, podcast host, and video creator whose subject expertise makes him worth commissioning and sponsoring. Give sponsors and editors credible work to evaluate quickly, then a simple way to start a useful email conversation. Use a clean editorial aesthetic with strong type, generous space, restrained color, and actual work.

This revamp supersedes the September layout and introduction recorded in this file’s Git history. Alex explicitly requested a complete redesign and asked the assistant to set the goal. On October 28, he selected “Choose an inquiry type, then email me” as the contact approach.

## Implemented

- One-page, dependency-free site with direct navigation to Video, Writing, Split Zone Duo, and Contact.
- Warm paper, deep green, serif headlines, thin rules, and an existing live-show portrait. No remote fonts, autoplay, embedded social widgets, or scroll-triggered animations.
- Three current, published video examples, including a clearly labeled Chase × SZD paid partnership.
- Dated personal Instagram/TikTok views and shares, with platform and measurement-window context.
- Six writing selections covering sports, business, technology, public space, and gambling, with publication archives for broader browsing. Some display titles are shortened descriptions rather than verbatim headlines.
- A distinct SZD section connected to both listening and partnership inquiries.
- Inquiry type is the only required contact field. Optional details sit in a native disclosure. The email opens with a fixed subject and useful prompts, or the details the visitor supplied. Nothing is sent by the website. Direct address reveal/copy and a no-JavaScript fallback are available.
- Existing protected newsletter backend and public configuration retained. Light/dark preference, keyboard access, reduced-motion support, share metadata, and structured data included.

## Content provenance

Reviewed the existing site; Alex’s SZD editorial and business workspaces, including the October public-facing SZD media kit; the freelance dashboard and published East Potomac assignment brief; the Social Videos strategy, September personal media kit source, and YouTube launch memory; and the connected Kirshner Media Buffer account. Private contracts, rates, finances, draft reporting, and partner economics were not added to the website.

### Current video selections

Verified as published through Buffer `get_post`, including original platform links and matching thumbnail assets, October 28, 2026:

- [Hawaiʻi–Northern Illinois](https://www.instagram.com/reel/De11HmyS_Ns/) — October 23. The site does not claim the original video is unsponsored.
- [Wake Forest–Cal](https://www.instagram.com/reel/Dej1MmVjrfu/) — October 16.
- [Chase × Split Zone Duo: budgeting college football fandom](https://www.instagram.com/reel/DePa5mAyfqV/) — October 8. Original caption explicitly identifies `#Ad #ChasePartner`.

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

## Verification

- Existing backend suite: 27 tests passed before and after the work.
- Browser suite: 16 checks passed, including responsive navigation and image loading at 320, 390, 700, 768, 1024, 1440, and 1920 pixels; no page-wide horizontal overflow. Video rail intentionally scrolls horizontally on phones.
- All inquiry types tested, including Unicode, ampersands, multiline ideas, optional details, fixed subjects, and no HTTP form submission. A regression test first demonstrated that the earlier required details prevented the desired type-only email path, then passed after the change.
- Direct email reveal and denied-clipboard fallback, theme persistence, unavailable local storage, keyboard disclosure control, anchor targets, control labels, structured data, and no-JavaScript contact tested.
- Newsletter success and rejection tested in the browser against mocked services; real backend contract checked by the unchanged server tests. No real signup or email was sent, and the production Apps Script was not changed. The client now explicitly requests Cloudflare’s supported compact widget size so a real challenge fits the narrowest layout.
- Representative text contrast measured in light/dark themes: minimum sampled normal-text ratio 4.75:1. Reduced-motion mode disables smooth scrolling.
- JavaScript syntax and Git whitespace checks run. No lint/typecheck command or build step is configured for this static project.
- Browser screenshots visually inspected. Local user-facing copies are kept in ignored `output/previews/`.

## Review and delivery

Implementation used the Compound Engineering work workflow. A separate simplification review removed a no-op JavaScript filter, an unused CSS selector, and a redundant responsive rule; no new abstraction or runtime dependency was needed. A completed five-lens code review (correctness, security, adversarial, testing, maintainability) returned no actionable findings. Receipt: run `portfolio-20261028-01a184aa`. The proposed external Claude review was rejected by automatic approval review before launch because the user had not explicitly authorized that transfer; local reviewers completed the review and no external review job started.

The review identified a Turnstile-mock footprint coverage gap. A dimensionally faithful fixture based on [Cloudflare’s widget-size documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) reproduced a challenge extending into the gutter at 320px. Explicit compact sizing fixed it; the regression now checks section bounds at 320px, 390px, 768px, and desktop, including resize. Real mail-client launch and production challenge validation remain outside local coverage. The source receipt is in the local temporary review directory; these notes retain the durable outcome.

## Deployment

The working preview runs at http://127.0.0.1:8897. Production remains on the prior site until this feature branch is merged to `main`. Keep the existing `CNAME`, public signup configuration, and Cloudflare analytics token. The local preview cannot validate a real Turnstile challenge because the production widget is restricted to the production hostname.
