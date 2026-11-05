import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { FormSubmissions } from '@/collections/FormSubmissions'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { InquiryForm } from '@/globals/InquiryForm'
import { PlatformLayers } from '@/globals/PlatformLayers'
import { SiteSettings } from '@/globals/SiteSettings'
import { isAdmin, isLoggedIn } from '@/lib/access'
import { emailConfigured, smtp } from '@/lib/email/config'
import { revalidateSite } from '@/lib/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Emails (password resets, inquiry notifications) go out over SMTP when SMTP_HOST is set.
// Without it Payload only prints each email to the server log, which is fine for local work.
const email = emailConfigured
  ? nodemailerAdapter({
      defaultFromAddress: smtp.fromAddress,
      defaultFromName: smtp.fromName,
      transportOptions: {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
        // Fail in seconds rather than hang when the mail server is unreachable.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      },
    })
  : undefined

// Uploads go to S3 when S3_MEDIA_BUCKET is set (required on serverless hosts such as Amplify, which
// have no persistent disk). Credentials come from the default AWS chain: the Amplify compute role in
// production, your AWS profile locally. Files are still served through /api/media/file, so the
// bucket stays private and Payload's access control applies.
const mediaBucket = process.env.S3_MEDIA_BUCKET
const mediaStorage = mediaBucket
  ? [
      s3Storage({
        collections: { media: true },
        bucket: mediaBucket,
        config: { region: process.env.S3_MEDIA_REGION || process.env.AWS_REGION || 'us-east-1' },
      }),
    ]
  : []

export default buildConfig({
  // Absolute URLs in the admin's meta tags. Empty keeps them relative when the variable isn't set.
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' | Tamtronics CMS' },
    components: { afterNavLinks: ['@/components/admin/LogoutButton'] },
  },
  editor: lexicalEditor(),
  ...(email ? { email } : {}),
  db: mongooseAdapter({ url: process.env.MONGODB_URI || '' }),
  collections: [Pages, Media, FormSubmissions, Users],
  globals: [Header, Footer, PlatformLayers, SiteSettings, InquiryForm],
  plugins: [
    ...mediaStorage,
    redirectsPlugin({
      collections: ['pages'],
      overrides: {
        access: { read: () => true, create: isLoggedIn, update: isLoggedIn, delete: isAdmin },
        admin: {
          group: 'Settings',
          description: 'Send visitors from an old URL (for example /old-page) to a new one.',
        },
        hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
      },
    }),
  ],
  cors: [serverUrl],
  csrf: [serverUrl],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
