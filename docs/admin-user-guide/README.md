# Tamtronics CMS: Admin Panel User Guide

Documentation for the people who manage the Tamtronics website through its Admin Panel (Payload CMS at `/admin`). It is written for non-technical administrators and marketing editors and is based on the website’s actual source code, not on generic Payload CMS behaviour.

**Version 1.0 · 16 November 2026 · documents Payload CMS 3.92.1**

## What is in this folder

| File | What it is |
| --- | --- |
| [admin-user-guide.md](admin-user-guide.md) | The complete step-by-step manual (21 chapters and 6 appendices). |
| [admin-user-guide.docx](admin-user-guide.docx) | The same manual as a formatted Word document: cover page, table of contents, numbered chapters, figures with captions, note/tip/warning boxes, header and page numbers. |
| [troubleshooting.md](troubleshooting.md) | Common errors and fixes (also Chapter 20 of the manual). |
| [screenshots/](screenshots/) | Pictures used in the manual (see “About the screenshots” below). |

## Start here

New to the CMS? Read these chapters first, in order:

1. [Logging in and out](admin-user-guide.md#2-logging-in-and-out)
2. [The dashboard](admin-user-guide.md#3-dashboard-overview) and [navigation](admin-user-guide.md#4-understanding-the-admin-panel-navigation)
3. [Managing pages](admin-user-guide.md#5-managing-website-pages) and [editing sections](admin-user-guide.md#6-editing-page-content-and-sections)
4. [Saving, publishing and updating](admin-user-guide.md#18-saving-publishing-and-updating-content)

## Contents

| # | Chapter | Covers |
| --- | --- | --- |
| 1 | [Introduction to the CMS](admin-user-guide.md#1-introduction-to-the-cms) | What the CMS is, roles, what is custom, what is **not** available |
| 2 | [Logging In and Out](admin-user-guide.md#2-logging-in-and-out) | Login, forgotten password, lock-out, session timeout, the custom **Log out** button |
| 3 | [Dashboard Overview](admin-user-guide.md#3-dashboard-overview) | The Collections panel and its four groups |
| 4 | [Understanding the Admin Panel Navigation](admin-user-guide.md#4-understanding-the-admin-panel-navigation) | Left menu, lists, search and filters, rows, locking, account page |
| 5 | [Managing Website Pages](admin-user-guide.md#5-managing-website-pages) | Create, edit, duplicate, rename, unpublish, delete pages |
| 6 | [Editing Page Content and Sections](admin-user-guide.md#6-editing-page-content-and-sections) | 7 section types, 19 element types, recipes |
| 7 | [Managing Images and Media](admin-user-guide.md#7-managing-images-and-media) | Upload, replace, alt text, delete |
| 8 | [Blogs, Blog Categories and Blog Posts](admin-user-guide.md#8-blogs-blog-categories-and-blog-posts) | **Not Available in Current CMS** |
| 9 | [Managing SEO Metadata](admin-user-guide.md#9-managing-seo-metadata) | Per-page SEO tab and site-wide defaults |
| 10 | [Managing the Website Header and Navigation](admin-user-guide.md#10-managing-the-website-header-and-navigation) | Logo, menu items, header button |
| 11 | [Managing the Website Footer](admin-user-guide.md#11-managing-the-website-footer) | Footer text, link columns, copyright |
| 12 | [Managing Global Website Settings](admin-user-guide.md#12-managing-global-website-settings) | Site Settings |
| 13 | [Platform Layers, Testimonials, FAQs and Other Content](admin-user-guide.md#13-platform-layers-testimonials-faqs-and-other-content) | Platform Layers; testimonials and FAQs are **Not Available** |
| 14 | [Managing Redirects](admin-user-guide.md#14-managing-redirects) | Old-address forwarding |
| 15 | [Managing the Business Inquiry Form and Enquiries](admin-user-guide.md#15-managing-the-business-inquiry-form-and-enquiries) | Form settings, emails, Form Submissions |
| 16 | [Managing Users and Your Account](admin-user-guide.md#16-managing-users-and-your-account) | Roles, adding users, unlocking |
| 17 | [Using the Custom Admin Panel Features](admin-user-guide.md#17-using-the-custom-admin-panel-features) | Custom vs standard features |
| 18 | [Saving, Publishing and Updating Content](admin-user-guide.md#18-saving-publishing-and-updating-content) | Drafts, Publish changes, Preview, Save |
| 19 | [Understanding Drafts and Version History](admin-user-guide.md#19-understanding-drafts-and-version-history) | Versions and restore (Pages only) |
| 20 | [Common Errors and Troubleshooting](admin-user-guide.md#20-common-errors-and-troubleshooting) | Also in [troubleshooting.md](troubleshooting.md) |
| 21 | [Content Management Best Practices](admin-user-guide.md#21-content-management-best-practices) | Habits and checklists |
| A–F | Appendices | Field reference for every section and element, permissions, feature inventory, glossary, screenshot checklist, about this guide |

Chapters 14 and 16 are additions to the requested outline, because the CMS has Redirects and user management that editors need. Requested chapters on blogs, testimonials, FAQs and DOCX import are included as short “Not Available in Current CMS” entries so nobody searches for features that do not exist.

## How it was made

- **Source-based.** Every area, field label, button, rule and limit was read from the project’s Payload configuration (`src/payload.config.ts`, the collections, globals and page blocks), its access rules and hooks, the custom admin component, the preview and cache-refresh code, and the standard Payload screens installed with it.
- **Generated field tables.** The field tables in the chapters and in Appendix A were produced directly from the loaded configuration, so labels, required fields, choices and limits match the CMS.
- **Custom vs standard.** The manual marks what is custom to this website (page builder, Business Inquiry Form, roles, preview, **Log out** button) and what is standard Payload CMS.
- **Read-only.** No source code, configuration, database record, environment variable or deployment setting was changed, and nothing was published. The only things done against the running site were ordinary page loads. No passwords, keys, database addresses or tokens appear in these files.

## About the screenshots

| Kind | Status |
| --- | --- |
| **Included (Figures 1 to 5):** the Admin Panel login screen, and the public website’s hero, header, footer and contact form with numbered callouts showing which CMS field controls each part | Captured from the running site without signing in or changing anything. |
| **Not included (18 boxes marked “Screenshot needed”):** signed-in Admin Panel screens such as the dashboard, Pages list and edit forms | No CMS login was available and the work was read-only, so these were **not invented**. Appendix E lists each one with exactly what to capture and how. |

## About the Word document

Open `admin-user-guide.docx` in Microsoft Word. If Word asks whether to update fields, choose **Yes**: this fills in the table of contents with page numbers. (If it does not ask, right-click the contents list and choose **Update Field**.)

## Keeping it current

Update the guide whenever a collection, global, page section, access rule or custom admin feature changes. If a blog, testimonials, FAQs or an import feature is added, replace the matching “Not Available” entries and add a chapter. Regenerate the Word document after editing the Markdown so the two stay identical.

## Related project documents

- `docs/CMS-GUIDE.md`: the shorter developer-written editor summary that this guide expands.
- `docs/DEPLOYMENT.md`: deployment, email and caching details for developers (not needed by editors).
