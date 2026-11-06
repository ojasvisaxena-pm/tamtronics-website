# Deploying the Tamtronics website

The app is a single Node server plus MongoDB and a folder of uploads.

## What production needs

- Node 20.9+ (the Docker image uses 22)
- MongoDB, on Atlas or self-hosted. Give the site its own database and a user limited to it.
- A persistent disk for uploads (`MEDIA_DIR`). Hosts without one, such as Vercel, need a Payload cloud storage adapter added first.
- HTTPS at your proxy or host. The app doesn't terminate TLS.
- An SMTP account for inquiry notifications and password resets (`SMTP_*`, `EMAIL_FROM_*`). Without one the site still works and saves every submission, but sends no email.

The variables are listed in the [README](../README.md#environment-variables).

## Build and first launch

**The build needs to reach MongoDB**, because the home page is prerendered, and the database must already be seeded. Otherwise the prerender has no home page to render.

```bash
npm ci
export MONGODB_URI=... PAYLOAD_SECRET=... NEXT_PUBLIC_SERVER_URL=https://tamtronics.com
npm run seed
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cd .next/standalone && PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

Set `MEDIA_DIR` to the same absolute path for the seed and the server, since the default location is relative to the build. Use `node server.js` in production; `next start` warns under standalone output.

Then:

1. Open `/admin` promptly and create the first admin user. Until then, anyone who reaches the page could.
2. Check **Site Settings > Public website address**. Email links and the confirmation email's button use it.
3. In **Forms > Business Inquiry Form > Email notifications**, add who should receive inquiries. Then send a test inquiry and check that both emails arrive and that Forms > Form Submissions shows them as *Sent*.
4. Point uptime monitoring at `GET /api/health`, which returns 503 if the database is unreachable.

## AWS Amplify (staging)

Amplify Hosting runs the site as a Next.js SSR app (platform `WEB_COMPUTE`), building from the `staging` branch with [amplify.yml](../amplify.yml).

| Piece | Where |
| --- | --- |
| Region / account | `us-east-1` / `070648356909` |
| Database | MongoDB Atlas. Amplify SSR can't reach a VPC, so DocumentDB and self-hosted private databases won't work. Atlas network access must allow `0.0.0.0/0`, because Amplify has no fixed egress IPs. Use a strong password and a user limited to the site's database. |
| Secrets | Secrets Manager `tamtronics/staging/app` (JSON: `MONGODB_URI`, `PAYLOAD_SECRET`, `SMTP_USER`, `SMTP_PASS`, optionally `REVALIDATE_SECRET`) |
| Uploads | Private S3 bucket `tamtronics-media-staging-070648356909` (versioned, encrypted, TLS only), served through `/api/media/file` |
| IAM | [infra/amplify-iam.yaml](../infra/amplify-iam.yaml): service role (build reads the secret) and compute role (SSR reads and writes the bucket) |
| Non-secret settings | Amplify environment variables: `APP_SECRET_ID`, `NEXT_PUBLIC_SERVER_URL`, `S3_MEDIA_BUCKET`, `S3_MEDIA_REGION`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` |

**How secrets reach the server.** Amplify environment variables exist only during the build. [scripts/amplify-env.mjs](../scripts/amplify-env.mjs) reads the secret with the service role and writes it, with the non-secret settings, to `.env.production`. Next.js loads that file on the server only. The script refuses `NEXT_PUBLIC_` secret keys and never prints values. To rotate a secret, update it in Secrets Manager and redeploy the branch.

**Media without a compute role (current setup).** The SSR runtime gets AWS credentials only from the Amplify compute role. Until an admin attaches it, `S3_MEDIA_PUBLIC_READ=true` is set: media URLs point straight at the bucket, and its policy allows public `s3:GetObject` on objects only. Listing and writes stay private. CMS uploads fail in this mode. Once the compute role is attached, set the variable to `false`, remove the `PublicReadMediaObjects` statement from the bucket policy, turn **Block public access** back on, and redeploy.

**One-time setup by an admin.** These steps need IAM permissions, which `PowerUserAccess` lacks.

```bash
aws cloudformation deploy --region us-east-1 --stack-name tamtronics-amplify-iam-staging \
  --template-file infra/amplify-iam.yaml --capabilities CAPABILITY_NAMED_IAM
aws cloudformation describe-stacks --region us-east-1 --stack-name tamtronics-amplify-iam-staging \
  --query 'Stacks[0].Outputs' --output table
# After the Amplify app exists:
aws amplify update-app --region us-east-1 --app-id <APP_ID> \
  --iam-service-role-arn <ServiceRoleArn> --compute-role-arn <ComputeRoleArn>
```

**Seeding a new database.** Run this from a machine with an AWS profile that can write to the bucket:

```bash
MONGODB_URI='<atlas uri>' PAYLOAD_SECRET='<from the secret>' AWS_PROFILE=<profile> \
  S3_MEDIA_BUCKET=tamtronics-media-staging-070648356909 S3_MEDIA_REGION=us-east-1 npm run seed
```

Amplify runs several SSR instances. CMS edits still reach all of them at once; see [Caching and content updates](#caching-and-content-updates). The inquiry form's rate limit is per instance.

After seeding or restoring a database the live site already uses, clear the page cache: `POST /api/revalidate` (same section).

## Docker

```bash
cp .env.example .env              # set PAYLOAD_SECRET and NEXT_PUBLIC_SERVER_URL
docker compose up -d mongo        # the build connects to it
docker compose run --rm seed      # once, on a new database
docker compose up -d --build web
```

The Docker files have not been run yet: Docker wasn't running on the machine where this was built. Test them before relying on them.

## Caching and content updates

Published changes show on the live site on the next page load, on every server instance, without a rebuild or deployment.

| Layer | What it does | How it is kept fresh |
| --- | --- | --- |
| CDN (CloudFront on Amplify) | Serves `/_next/static` (hashed, cached a year), images and `/assets` | Website pages are sent with `Cache-Control: public, max-age=0, s-maxage=0, must-revalidate` ([next.config.ts](../next.config.ts)), so the CDN asks the server every time and gets a quick `304` when nothing changed. Amplify's CDN can't be purged except by a deployment, so pages must not be stored there. |
| Page cache (Next.js ISR) in each server instance | Keeps rendered pages, so most requests don't touch the database. Refreshes hourly as a fallback. | CMS hooks ([src/lib/revalidate.ts](../src/lib/revalidate.ts)) clear it on publish, unpublish, delete, and any change to a global, media or redirects. Draft saves and autosave don't. [cache-handler.mjs](../cache-handler.mjs) records each clear in MongoDB (`payload-kvs`, keys `next-cache:revalidated-tag:*`). Every instance checks for new clears at most once a second before serving from its cache. |
| Browser | Next.js reuses prefetched pages for up to 5 minutes while a visitor stays on the site | Reloading the page shows the latest version. |

Every published change refreshes all pages, because they share the header, footer and settings, and redirects can point at any page.

**Changes made outside the CMS** (seed or migration scripts, database restores) don't run the hooks. Clear the cache afterwards, as a signed-in CMS user or with `REVALIDATE_SECRET`:

```bash
curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" https://<site>/api/revalidate
# {"ok":true,"revalidated":"/","at":"..."}   401 without a valid secret or session
```

**Checking it.** Response headers show the state: `x-nextjs-cache: HIT` (served from the page cache), `MISS` or `STALE` (rendered), and `X-Cache` from CloudFront. The server log has a line for each clear (`Site cache cleared: ...`). Errors are logged too: `Site cache not cleared` from a hook, `[cache-handler] ...` if MongoDB can't be reached. In that case instances fall back to the hourly refresh until it's back.

## Backup and recovery

Back up the database and the uploads folder together, as each refers to the other.

```bash
mongodump  --uri="$MONGODB_URI" --archive=tamtronics-$(date +%F).gz --gzip
tar czf media-$(date +%F).tgz "$MEDIA_DIR"
```

Restore:

```bash
mongorestore --uri="$MONGODB_URI" --archive=tamtronics-YYYY-MM-DD.gz --gzip --nsInclude='tamtronics.*'
tar xzf media-YYYY-MM-DD.tgz -C /
```

`mongorestore` without `--drop` only adds missing documents. Add `--drop` only when you mean to replace the database. Practise a restore on a spare database. Atlas also offers scheduled snapshots.

## Database migrations

**Databases set up before the Business Inquiry Form existed** (with an `inquiries` collection): run `npx tsx scripts/migrate-inquiry-form.ts`, check its preview, then run it again with `--apply`. It copies; the old `inquiries` collection stays as a backup and can be dropped once you're satisfied.

MongoDB needs no schema migrations for new fields. If a field is renamed or restructured, write a Payload migration (`npm run payload migrate:create`) and run `npm run payload migrate` before deploying the new code. Take a backup first.

## Security in place

- Admin and API writes need a signed-in user; roles are admin and editor.
- Accounts lock for 10 minutes after 5 failed logins.
- Form submissions can only be created through the validated endpoint, which applies a same-origin check, a rate limit, a honeypot, duplicate detection, and the rules set in the CMS. Submissions and the email settings are never readable without signing in.
- Inquiry emails are sent after the submission is saved and before the reply, waiting at most 20 seconds. Serverless hosts such as Amplify freeze the function once it replies, so they can't send afterwards. If sending doesn't finish, the submission shows "Sending" in the admin; nothing is retried automatically.
- Credentials stay in server-side environment variables.
- No Content-Security-Policy is set site-wide; add one at launch if your security policy needs it.
