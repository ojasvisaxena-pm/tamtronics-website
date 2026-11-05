# Editing the Tamtronics website

Sign in at `/admin`. No code is needed for any of the tasks below.

## Where things are

| To change | Go to |
| --- | --- |
| Text, images and sections on a page | Content > Pages |
| Uploaded images | Content > Media |
| Contact form submissions | Forms > Form Submissions |
| The contact form's fields, messages and emails | Forms > Business Inquiry Form |
| Top menu, logo, header button | Site > Header |
| Footer text, links, copyright | Site > Footer |
| The four-layer explorer on Home and Platform | Site > Platform Layers |
| Site address, default social image, favicon, Tag Manager | Site > Site Settings |
| Forwarding an old address | Settings > Redirects |
| Who can sign in | Settings > Users (admins only) |

## Common tasks

**Edit a page.** Open it under Pages and change the fields. Your changes save as a draft automatically; visitors don't see them yet.

**Preview.** Use the Preview button to see the draft on the real site. Click "Exit preview" at the bottom right when done.

**Publish.** Click Publish changes. The live page updates straight away.

**Add, remove or reorder sections.** On a page's *Page sections* tab, use Add Section, the row menu to remove one, and the drag handle to reorder.

**Create a page.** Pages > Create new. Enter a title and a slug: the slug `pricing` is served at `/pricing`. Add sections, then publish. Add it to Header or Footer if it should appear in the menus.

**Replace an image.** Click the image field in a section and choose or upload another. To replace it everywhere, upload a new file on the Media item itself. Alt text is required.

**Italic accent in a headline.** Wrap words in asterisks: `See what your equipment is doing *after it leaves* the building.`

**Links.** Use site addresses such as `/platform`, `/industries#dme`, or `/contact?industry=dme`, which preselects the form's industry using the key set on the form's choices.

**SEO.** Each page has an SEO tab for the search title, description, social text and image, and a setting to hide it from search engines.

**Rename a page.** Changing a slug changes the address and existing links won't follow. Update links that point to it and add a Redirect from the old address.

## The Business Inquiry Form

**Change the form.** Forms > Business Inquiry Form, then Save. The contact page updates straight away.

- **Fields tab:** the heading and description, and for each field its label, placeholder, whether it's required, the minimum and maximum length, and the messages people see. Messages can use `{min}` and `{max}`. Email is always required, because the confirmation goes there. You can turn the work-email check on or off and edit the list of refused providers. The industry choices are listed here too; each has a key used in links such as `/contact?industry=dme`.
- **Buttons and messages tab:** the button text, the error summary, the message if sending fails, and what people see after sending.
- **Email notifications tab** (only admins can change it):
  - *Email to the team:* turn it on or off, list who receives it, and set the subject. Replies go to the person who sent the inquiry. If no one is listed, the `INQUIRY_RECEIVER_EMAIL` server setting is used.
  - *Confirmation to the sender:* turn it on or off, and set the subject, heading, text, whether to include a copy of what they sent, contact details and sign-off. Use `{name}`, `{firstName}`, `{email}`, `{company}` and `{industry}` to personalise.
  - *Time zone* for dates in emails.

The fields themselves (name, email, company, industry, message) are fixed, because the emails and the submissions list depend on them. Their wording and rules are all editable.

**Read and manage submissions.** Forms > Form Submissions lists the newest first, with the sender, company, status and date. Search by name, email, company or message, filter by any field with Filters, and click a column heading to sort. Open one to see everything that was sent. In the sidebar:

- **Status:** New, In progress or Completed. Use it to track follow-up.
- **Notes:** internal notes, never sent anywhere.
- **Email delivery:** whether each email was sent. *Failed* shows the reason from the mail server. *Not sent (email not set up)* means the server has no SMTP settings. The submission is always kept, even when email fails.

What people typed can't be edited, so the record stays as it was received. Only admins can delete submissions.

## Things to know

- **Text inside animated diagrams needs a developer.** Captions next to them are editable.
- **The usage chart is calculated.** Edit the sessions under each unit and the blocks and totals update. A unit with no sessions shows as idle.
- **Forgot password** emails a reset link that works for one hour. It needs the mail server settings in the README; until they're set, the link only appears in the server log, and an admin can set a new password under Settings > Users.
- **Roles:** editors manage content, media and form submissions. Only admins can delete pages or media and manage users.
