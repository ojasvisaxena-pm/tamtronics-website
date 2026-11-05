#!/usr/bin/env node
/**
 * Amplify build step: writes .env.production for the Next.js SSR runtime.
 *
 * Amplify environment variables exist only during the build, not in the SSR runtime, so the
 * values the server needs are written to .env.production, which Next.js loads on the server only.
 *
 * - Secrets come from AWS Secrets Manager (APP_SECRET_ID, a JSON secret), read with the Amplify
 *   service role. They are never printed and never prefixed NEXT_PUBLIC_, so they stay out of the
 *   browser bundle.
 * - Non-sensitive settings come from the Amplify environment variables listed in PASSTHROUGH.
 *
 * Usage: node scripts/amplify-env.mjs   (reads APP_SECRET_ID and AWS_REGION from the environment)
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const REQUIRED_SECRETS = ['MONGODB_URI', 'PAYLOAD_SECRET']
const PASSTHROUGH = [
  'NEXT_PUBLIC_SERVER_URL',
  'S3_MEDIA_BUCKET',
  'S3_MEDIA_REGION',
  'S3_MEDIA_PUBLIC_READ',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'EMAIL_FROM_ADDRESS',
  'EMAIL_FROM_NAME',
  'INQUIRY_RECEIVER_EMAIL',
]

const fail = (msg) => {
  console.error(`amplify-env: ${msg}`)
  process.exit(1)
}

const secretId = process.env.APP_SECRET_ID
if (!secretId) fail('APP_SECRET_ID is not set (Amplify > Environment variables).')

let secrets
try {
  const raw = execFileSync(
    'aws',
    ['secretsmanager', 'get-secret-value', '--secret-id', secretId, '--query', 'SecretString', '--output', 'text'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  secrets = JSON.parse(raw)
} catch (err) {
  // stderr from the CLI holds the AWS error (for example AccessDenied), never the secret value.
  fail(`could not read secret "${secretId}": ${err.stderr?.toString().trim() || err.message}`)
}

for (const key of REQUIRED_SECRETS) {
  if (!secrets[key] || String(secrets[key]).startsWith('PENDING')) fail(`secret key ${key} is missing or still a placeholder.`)
}
for (const key of Object.keys(secrets)) {
  if (key.startsWith('NEXT_PUBLIC_')) fail(`secret key ${key} would be exposed to the browser; rename it.`)
}

const values = { ...secrets }
for (const key of PASSTHROUGH) if (process.env[key]) values[key] = process.env[key]

// Single quotes: dotenv takes the value literally (no $ expansion), which matters for passwords.
const line = (key, value) => {
  const v = String(value)
  if (v.includes("'") || /[\r\n]/.test(v)) fail(`value of ${key} contains a quote or newline, which .env cannot hold safely.`)
  return `${key}='${v}'`
}

writeFileSync('.env.production', Object.entries(values).map(([k, v]) => line(k, v)).join('\n') + '\n', { mode: 0o600 })
console.log(`amplify-env: wrote .env.production with ${Object.keys(values).length} keys: ${Object.keys(values).join(', ')}`)
