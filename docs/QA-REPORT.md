# QA report

Run on 2 November 2026 on Windows 11, and rerun after the switch to clean URLs (`/about` instead of `/about.html`), Node 24, MongoDB (local) and Chromium (Playwright 1.64). The final run used the **production standalone server** (`node .next/standalone/server.js`) against a throwaway `tamtronics_qa` database seeded with `npm run seed`. That database was dropped afterwards.

## Business Inquiry Form and email (5 November 2026)

Rerun after adding the Business Inquiry Form global, Form Submissions and SMTP email, on the production standalone build against a copy of the real database with the migration applied. A small SMTP server inside the test run received the real emails the server sent.

**84 of 84 tests passed in one full run**, the 76 below plus 8 new ones. `tsc`, `eslint` and `next build` passed. Contact still matches the original exactly as before (0.52% / 13.3% / 13.9%).

The new tests cover:

- **Both emails:** a submission from the page sends one team email (subject with name and company, Reply-To the sender, every field, date and time, admin link, text version) and one confirmation (thanks, copy of what was sent, contact details, site colours). Submitting it again stores nothing and sends nothing.
- **Double clicks:** two clicks in the same instant send one request.
- **Injection:** a name containing a line break and `Bcc:` can't add a header or recipient, and HTML in the company is escaped in both emails.
- **Mail server failure:** the submission is kept, the reply to the visitor is still a success, both emails show *Failed* with the server's reason (`451`), and the log has no credentials.
- **Turned off:** with notifications disabled, nothing is sent and both show *Not sent (turned off)*.
- **CMS control:** changing the heading, a label, a placeholder, the submit text, the success heading, making Company optional and the message limit 300 changes the page, and the server applies the same rules (422 with the CMS message). An industry not in the list is refused.
- **Privacy and status:** visitors can't list or create submissions, can't change the form, and don't see the email settings or recipients in the public API. Admins list newest first, filter by status, search, and set In progress and Completed. Delivery records can't be changed through the API.
- **Admin screens:** Form Submissions shows ID, sender name and email, company, status and date. A submission opens with its message, status and email delivery. The Business Inquiry Form opens on each tab.

Found and fixed: two clicks in the same instant sent two requests, because the guard read React state that hadn't updated yet. The server's duplicate check had stopped a second record, but the browser now sends once.

Not tested: a real email provider (Gmail, Brevo and so on), and how the emails render in Outlook, Gmail and Apple Mail. The templates use tables and inline styles for that reason, and were checked in a browser at 700 and 375px wide.

## Result (2 November 2026)

**76 of 76 tests passed.** The clean-URL run passed 75. The 76th, editor-made redirects, failed because the test checked only the first redirect hop; an old `.html` address now reaches an editor's redirect in two hops. The test was changed to follow the full chain in a browser, and its file was rerun (15 of 15 passed).

Static checks on the final code: `tsc --noEmit` passed, `eslint` passed, and `next build` succeeded.

## What was tested

### Matches the original (`tests/parity.spec.ts`, 30 tests)

Each page was compared with the untouched original HTML site served next to it.

- **Text:** all words in `<main>` are identical on all 6 pages, ignoring whitespace between tags. The one allowed exception is the Contact form's former demo wording.
- **Metadata:** title, description, canonical, Open Graph, Twitter card, theme colour and heading outline match on all 6 pages. Canonical and `og:url` are compared without `.html`, the one intended change.
- **Pixels:** full-page screenshots were compared at 1440, 820 and 390px wide, with animations stopped and everything revealed.

| Page | 1440px | 820px | 390px | Height difference |
| --- | --- | --- | --- | --- |
| Home | 0.02% | 0.15% | 0.16% | ≤1px |
| Platform | 0.11% | 0.14% | 0.40% | ≤1px |
| First Implementation | 0.07% | 0.33% | 0.66% | ≤1px |
| Industries | 0.00% | 0.01% | 0.05% | 0 |
| About | 0.01% | 0.03% | 0.05% | 0 |
| Contact | 0.52% | 13.3% | 13.9% | 0 / 103 / 147px |

Percentages are the share of pixels that differ. The remaining differences are anti-aliasing and image resampling. Contact differs where the "Preview site" notice was removed, and everything below it moves up. Side-by-side screenshots confirmed both explanations.

### Site behaviour (`tests/site.spec.ts`, 31 tests)

All passed:

- **Every page:** returns 200 with no console errors, no failed requests and no broken images. No horizontal overflow at 1440, 820 or 390px. No serious or critical axe violations (WCAG 2 A/AA).
- **Links:** every internal link and `#anchor` on every page resolves.
- **URLs:** every page is served at its clean address. `/about.html`, `/platform.html`, `/contact.html?industry=dme`, `/index.html` and `/home` redirect with 308 to the right place. Original `/assets/...` URLs work, unknown pages return 404, and the sitemap lists only clean addresses. The home page has the corrected Organization JSON-LD.
- **Interactions:** header on scroll, mobile menu (focus, Escape, link), skip link, scroll reveal after client navigation, architecture explorer (click, arrow keys, plates, Enter, auto-cycle), walkthrough (autoplay, tabs, prev/next, play/pause, status), industries menu highlight, home tile deep links, reduced motion, and usage chart arithmetic.

### Form, CMS and security (`tests/form-and-cms.spec.ts`, 15 tests)

All passed:

- **Form:** errors, summary and focus; free-mail warning; character counter; `?industry=` preselect; a real submission is stored once; reset.
- **Form endpoint:** rejects invalid data (422), drops duplicates and honeypot bots silently, refuses foreign origins (403), and rate-limits (429).
- **Access control:** visitors can't read inquiries or users, create pages or inquiries, edit globals, or see drafts. Preview needs a login and won't redirect off-site.
- **Pages:** create a draft, confirm visitors can't see it, preview it, publish (live at once), edit and reorder sections (live at once), confirm unpublished edits stay private, and delete (404).
- **Validation:** slugs, and JSON-LD.
- **Globals:** Header and Footer edits appear on every page. Platform Layers updates both Home and Platform.
- **Media:** upload, alt text required, served as WebP through the optimizer, non-image files rejected, delete.
- **Redirects** created in the CMS work in the browser, whether saved as `/old` or `/old.html`.
- **Reserved slugs** such as `admin` are rejected, so a page can't hide the admin or API.
- **Admin panel:** login, every collection and global listed, page editor and header editor load without errors.

## Found and fixed during QA

- **Footer 7.6px taller.** The original `<picture><source>` changed the logo's baseline. Fixed with one CSS rule.
- **Standalone server crashed loading the CMS** because sharp's native files weren't copied into the build. `next start` hid this. Fixed in `next.config.ts`.
- **Three accessibility issues inherited from the original markup** (see MIGRATION-INVENTORY.md). Fixed with no visual change.

## Not tested

- **Docker image and docker-compose:** the Docker daemon wasn't running.
- **Browsers and devices:** Safari, Firefox, real phones and screen readers. The original README lists the same gap.
- **Hosting:** a real deployment, HTTPS, MongoDB Atlas, and multiple instances.
- **Performance:** Lighthouse wasn't run.

## Known quirks

- An old `.html` address with an editor-made redirect takes two hops: `.html` is removed first, then the editor's redirect applies. Redirects that editors create in the CMS also send the same `Location` header value twice, which comes from Next.js. Browsers follow it normally. The built-in `.html` redirects are clean.
- The form rate limit is in memory, per server instance, and trusts `X-Forwarded-For`. That's fine behind a proxy that sets the header, but a client that can reach the server directly could get around it.

## Re-running

```bash
npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
# start the standalone server on :3100 against a throwaway database, and serve ../tamtronics-html on :8099
# for the email tests, also start the server with SMTP_HOST=127.0.0.1 SMTP_PORT=2526 SMTP_SECURE=false
QA_DATABASE=tamtronics_qa QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=... QA_SMTP_PORT=2526 npm run test:e2e
```

`form-and-cms.spec.ts` writes data, so it only runs when `QA_DATABASE` is set.
