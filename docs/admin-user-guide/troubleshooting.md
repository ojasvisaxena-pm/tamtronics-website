# Tamtronics CMS: Troubleshooting Guide

*Chapter 20 of the [CMS Admin Panel User Guide](admin-user-guide.md). Section numbers (20.1, 20.2…) match the full guide, and section references such as “section 16.5” point to the full guide.*

## 20.1 How to use this chapter

Find the heading that matches what you see, then follow the steps. Messages in quotation marks are the exact words the CMS or the website shows. If a problem is not solved, collect the details listed in section 20.9 and contact the developer.

> **Note:** Several problems below can only be fixed by the developer (for example the mail server or file storage). Those entries say so, so you do not waste time.

## 20.2 Signing in

| What you see | Likely cause | What to do |
| --- | --- | --- |
| “The email or password provided is incorrect.” | Typing mistake, wrong account, or caps lock on. | Retype carefully. Use **Forgot password?** if unsure. |
| “This user is locked due to having too many failed login attempts.” | 5 wrong attempts in a row. | Wait **10 minutes**, or ask an **Admin** to open your user in **Settings › Users** and click **Force Unlock** (section 16.5). |
| No password-reset email arrives | The email might be in spam or junk; or the website’s mail server is not set up; or the address is not registered. | Check spam. Wait a few minutes. Then ask an **Admin** to set a new password (section 16.4). The CMS always says “If the email address is associated with an account, you will receive instructions…” whether or not the address exists. |
| “Token is either invalid or has expired.” on the reset page | The reset link is older than **one hour** or was already used. | Start again with **Forgot password?** and use the newest email. |
| “You have been logged out due to inactivity.” | About two hours without activity. | Log in again. Unsaved edits on Header, Footer and similar screens are lost; page drafts are kept. |
| You see **Create first user** | The website has no users yet. | Do not enter anything. Tell the developer (section 2.3). |
| The Login page does not load at all | The website or its database is down, or the address is wrong. | Check the address ends with `/admin`. Try the public website. If that is also down, contact the developer. |

## 20.3 Saving and publishing

| What you see | Likely cause | What to do |
| --- | --- | --- |
| “Please correct invalid fields.” or “The following field is invalid:” | A required or invalid field. | Scroll through the tabs: fields with a problem show a red outline and message. Fix them and try again. Required fields have an asterisk (*). |
| “Use lowercase letters, numbers and hyphens only.” (Slug) | The slug has capitals, spaces or symbols. | Use something like `case-studies`. |
| “This address is used by the system. Please choose another.” (Slug) | The slug is one of: admin, api, preview, assets, media, sitemap, robots. | Choose a different slug. |
| “Value must be unique” (Slug or From URL) | Another page (or redirect) already uses it. | Choose another slug, or find the other page in **Content › Pages**. |
| “This is not valid JSON.” (Structured data) | The code box has a typing mistake or is not JSON. | Remove the text or ask your SEO specialist for valid code. |
| “Use a full address such as https://tamtronics.com” | **Public website address** is not a full address, or ends with `/`. | Type `https://` and the domain with no slash at the end. |
| “Use the format GTM-XXXXXXX.” | **Google Tag Manager ID** has the wrong format. | Copy the ID again from Tag Manager, or clear the field. |
| “Use a time like 8:10 AM.” (Usage chart) | **Start** is not in the right format. | Type hour, colon, minutes, space, **AM** or **PM**. |
| “Must be at least the minimum.” (form) | **Maximum characters** is lower than **Minimum characters**. | Raise the maximum or lower the minimum. |
| “Lowercase letters, numbers and hyphens only.” (industry **Key**) | The key has capitals or spaces. | Use something like `rental`. |
| “Not a time zone name. Try UTC or America/New_York.” | Wrong time-zone text. | Use a name from the list of time zones, such as `Asia/Kolkata`. |
| “You are not allowed to perform this action.” | Your role does not allow it, for example an **Editor** trying to delete. | Ask an **Admin** to do it. See Appendix B. |
| “There was a problem while autosaving this document.” | Connection dropped or you were signed out. | Check your connection, copy any text you typed, reload, sign in again. |
| The **Delete** option is missing | You are an **Editor**. | Only Admins can delete. |
| The **Publish changes** button is missing | You are looking at a version in the **Versions** tab, or a screen that uses **Save**. | Go back to the **Edit** tab. Only **Pages** have **Publish changes**. |
| “Document locked” | Someone else is editing the same record. | Ask them to finish. After about 5 minutes without activity the lock ends. Use **Take over** only after agreeing it with them. |

## 20.4 My change is not showing on the live website

Go through these steps in order:

1. **Did you publish?** For a page, check **Status**: it must say **Published**, not **Draft** or **Changed**. Click **Publish changes**.
2. **Did you save?** On Header, Footer, Site Settings and other non-page screens, click **Save**. Nothing on them saves by itself.
3. **Reload properly.** Press **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac). Or open the page in a private/incognito window.
4. **Check the right address.** The change might be on a different page from the one you are looking at.
5. **Check you are not in preview.** If you see the white tag **“Viewing draft. Exit preview”**, click it and look again.
6. **Wait a minute** and reload. The website refreshes itself when you publish or save, but it can take a moment on a busy site.
7. **Mobile menu or footer:** check both the desktop and the mobile views.
8. If the old version is still there after step 6, tell the developer. The automatic refresh may need checking.

> **Note:** Search engines such as Google can take days to show a new title or description, even though the website itself changed at once.

## 20.5 Pages and links

| What you see | Likely cause | What to do |
| --- | --- | --- |
| The website shows “This page could not be found.” (404) for a page I created | The page is still a **Draft**, or its slug differs from the address you typed. | Publish it. Check the **Slug** exactly. |
| A menu or button leads to “This page could not be found.” | The **Link** has a typing mistake or no leading slash; or the page was unpublished or deleted. | Fix the **Link** (it must start with `/`), or publish the page. |
| The old address no longer works after I changed a slug | Redirect missing. | Create a redirect (Chapter 14). |
| A redirect does not work | **From URL** has no leading slash; the address has more than one part (for example `/news/old`); or a published page already exists at that address. | Redirects only work for one-part addresses like `/old-page` and only when no page lives there. |
| Preview says “Sign in to preview drafts.” | You are not signed in, or your session ended. | Sign in to the CMS in the same browser, then click **Preview** again. |
| I cannot get out of preview | The preview setting is stored in the browser. | Click **Exit preview**, or open `/preview/exit` on the website, or close the browser window. |
| A section does not appear | It may be in a draft, or you did not publish; or it has no heading/contents. | Check **Status**; open the section and check it has content. |
| An **Anchor ID** link does not jump | Typing mistake, or capital letters. | Use lowercase letters and hyphens; the link must end with `#` plus the same name. |
| My link in **Rich text** goes nowhere | You used **Internal link**. | Select the text again and use **Custom URL** (section 6.8). |
| An accent word shows asterisks on the website | A missing or extra `*`. | Use exactly one pair: `*like this*`. |

## 20.6 Images and media

| What you see | Likely cause | What to do |
| --- | --- | --- |
| “Invalid file type” | Only PNG, JPEG, WebP and SVG are accepted. | Convert the file (for example, save a PDF page as PNG). |
| “There was a problem while uploading the file.” or an upload that never finishes | A very large file, a connection problem, or the website’s file storage is not connected. | Try a smaller file (under about 2 MB). If it still fails, tell the developer: file storage may need attention. |
| “No files were uploaded.” | The file was not selected. | Choose the file again. |
| I cannot save a Media item | **Alt text** is required. | Describe the picture in **Alt text**. |
| A picture is missing on the live page | It was deleted from Media, or the **Image** field is empty. | Open the section and choose a picture again. |
| The picture looks stretched or cut off | The **Photo** element’s **Aspect ratio** or **Max width (px)** setting. | Adjust those fields, or tick **Show whole image on white**. |
| The old favicon still shows | Browsers cache favicons for a long time. | Close all tabs of the site and reopen, or try another browser. |
| I replaced a file but the page still shows the old one | The browser saved a copy. | Press **Ctrl + F5**. |

## 20.7 Forms and enquiries

| What you see | Likely cause | What to do |
| --- | --- | --- |
| Visitors see “We could not send your inquiry. Please try again in a moment.” (or your own **Message if sending fails**) | A temporary website or database problem, or a visitor who sent more than 5 forms in 10 minutes. | Ask them to wait a few minutes and try again. If it keeps happening, tell the developer. |
| A visitor says they are told to “Please use your work email…” | **Ask for a work address (refuse free-mail providers)** is ticked. | Untick it or remove that provider from **Free-mail domains** (Chapter 15). |
| Nobody received the team email | **Email the team about each new inquiry** is off; **Send to** is empty and no fallback address is set; or the mail server is not set up. | Open the submission in **Forms › Form Submissions** and read **Email delivery** and **Last delivery problem**. |
| **Email delivery** says **Not sent (email not set up)** | No mail server is connected, or there is no recipient. | Tell the developer; an Admin can check **Send to**. The submission itself is safe. |
| **Email delivery** says **Failed** | The mail server refused the message. | Read **Last delivery problem** and pass it to the developer. Contact the visitor directly using the saved email address. |
| **Email delivery** stays on **Sending** | The mail server did not answer in time. Nothing is retried automatically. | Contact the visitor directly; tell the developer. |
| The **Email notifications** tab is read-only | You are an **Editor**. | Ask an **Admin**. |
| The same message appears only once although it was sent twice | Duplicate protection: identical message from the same email within 10 minutes is kept once. | Expected behaviour. |
| I cannot edit what a visitor wrote | Submissions are read-only by design. | Use **Notes** to record corrections. |

## 20.8 Dashboard, lists and display

| What you see | Likely cause | What to do |
| --- | --- | --- |
| The dashboard is empty: “There are no widgets on your dashboard…” | The **Collections** widget was removed from **your** view. | Use the **Dashboard** menu in the top bar and choose **Reset Layout** (or **Add Widget**). The left menu always works meanwhile. |
| A list shows “No … found” | A filter or search is active. | Use **Clear All** on the filters and clear the search box. |
| The list columns are not the ones in this guide | Someone changed the **Columns** for your login. | Use **Reset Preferences** on your Account page. |
| Text on the page looks different from the CMS | The accent asterisks, or a section’s **Background** setting. | Check the section’s fields. |
| Something looks broken on the website itself | A design (not content) problem. | Tell the developer; the CMS cannot change layouts or styles. |

## 20.9 What to tell the developer

If you have to escalate, send:

1. **What you were doing** (for example “Publishing the About page”).
2. **The exact message** you saw (copy it, or take a screenshot).
3. **The page address** (from the browser’s address bar).
4. **Your role** (Admin or Editor) and the **time** it happened.
5. **Your browser** (Chrome, Edge, Safari…) and whether it also happens in a private window.

> **Warning:** Never send your password in a message. The developer never needs it.

