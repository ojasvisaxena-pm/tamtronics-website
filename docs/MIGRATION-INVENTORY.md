# Migration inventory

Source: `tamtronics-html/`, which was not modified. Test results are in [QA-REPORT.md](QA-REPORT.md).

## Pages

| Page | Original file | URL now | Sections, in order | Status |
| --- | --- | --- | --- | --- |
| Home | `index.html` | `/` (`/index.html` redirects) | Hero, usage chart + cards, what we do, four-layer explorer, first implementation, industry tiles, about strip, CTA | Migrated |
| Platform | `platform.html` | `/platform` | Hero, pipeline, four-layer explorer, 4 layer details, activity to answer, why visibility, implementation steps, CTA | Migrated |
| First Implementation | `first-implementation.html` | `/first-implementation` | Hero + collage, relationship diagram, walkthrough, signals, app screens, is / isn't, CTA | Migrated |
| Industries | `industries.html` | `/industries` | Hero, sticky menu, 4 industry sections, pattern pipeline, CTA | Migrated |
| About | `about.html` | `/about` | Hero, purpose, independence, how we work, where we are | Migrated |
| Contact | `contact.html` | `/contact` | Hero, inquiry form + sidebar | Migrated; form now really sends |
| Chart options | `review/chart-options.html` | Not served | Client review sheet | **Deliberately not migrated** |

The source README says the `review/` page is "NOT part of the site" and should be excluded from deployment. It stays in `tamtronics-html/review/`.

## CMS structure

**Collections:** Pages, Media, Form Submissions, Users, Redirects.

**Globals:** Header (also holds navigation), Footer, Platform Layers, Site Settings, Business Inquiry Form (the contact form's fields, messages and emails). A separate Navigation global would have split one menu across two screens, so it was left out.

**Page sections:** Hero, Content section, Two-column section, Call-to-action band, Sticky section menu, Industry section, Inquiry form.

**Elements inside sections:** Text, Rich text, Photo, Cards, Numbered list, Buttons, Note, Small print, Diagram, Collage, Usage chart, Link tiles, Pipeline, Comparison, Signal list, App screens, Layer detail, Four-layer explorer, Walkthrough.

Collections suggested in the brief but not created, because the site has no such content: Blog Posts, Categories, Services, Testimonials, Locations. Team, pricing, FAQ, gallery and video blocks were skipped for the same reason.

## Functionality

| Original behaviour | Now |
| --- | --- |
| Header turns solid on scroll | `SiteHeader` |
| Mobile menu: focus handling, Escape, close on link and resize | `SiteHeader` |
| Scroll reveal | `SiteEffects`, re-run after each page change |
| SVG animation pauses off-screen and for reduced motion | `SiteEffects` |
| Architecture tabs: click, arrows, plates, auto-cycle | `ArchExplorerClient` |
| Walkthrough: autoplay, tabs, prev/next, play/pause | `WalkthroughClient` |
| Industries menu highlight | `SectionNav` |
| Form validation, free-mail check, counter, `?industry=` | `InquiryForm`, with the same rules also on the server |
| Footer year | `{year}` in the Footer global |

## Assets

All 19 image files are in `public/assets/img`, so the original asset URLs keep working. The 10 best-quality masters are also in the CMS Media library. `next/image` generates WebP from them, so the supplied `.webp` copies weren't uploaded. The 20 inline SVGs are in `src/diagrams/data.ts`, unchanged. Fonts are the same three families, now self-hosted through `next/font`.

## Intentional differences from the original

1. **Clean URLs.** Pages moved from `/about.html` to `/about`, at the client's request. Every old `.html` address redirects permanently (308), including anchors and query strings such as `/contact.html?industry=dme`. Canonical, `og:url` and the sitemap use the new addresses. The original site was never live at tamtronics.com, so no search ranking depended on the old ones.
2. **Contact form wording.** The original was a demo and said so. Because it now sends, the "Preview site" and "Demonstration only" notices are gone, the button reads "Send inquiry" instead of "Review inquiry", and the success heading is new. This is why Contact is shorter on narrow screens.
3. **Organization JSON-LD URL.** The original pointed to the placeholder `www.tamtronics.example`. It now uses `https://tamtronics.com/`.
4. **Added:** `sitemap.xml` and `robots.txt`, which the original README listed as to-do.
5. **Accessibility fixes, with no visual change:** the four-layer list is now an accordion rather than an invalid tablist, the architecture diagram is a group rather than an image containing buttons, and usage chart sessions are no longer focusable inside a hidden region.

## Database

The new `tamtronics` database was created. The existing `archive21` database, used by the separate AMS app, wasn't modified.
