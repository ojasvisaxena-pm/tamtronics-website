/**
 * Where CMS uploads live. Shared by payload.config.ts (the S3 adapter) and the Media collection
 * (admin thumbnails), so both agree on the URLs.
 *
 * - S3_MEDIA_BUCKET set: files are stored in S3, otherwise on disk (MEDIA_DIR).
 * - S3_MEDIA_PUBLIC_READ=true: browsers load files straight from S3, which needs a bucket policy
 *   allowing public s3:GetObject. Use it when the server can't read the bucket itself, for example
 *   Amplify without a compute role. Otherwise files are served privately through /api/media/file.
 */
export const mediaBucket = process.env.S3_MEDIA_BUCKET || ''
export const mediaRegion = process.env.S3_MEDIA_REGION || process.env.AWS_REGION || 'us-east-1'

export const mediaPublicBase =
  mediaBucket && process.env.S3_MEDIA_PUBLIC_READ === 'true' ? `https://${mediaBucket}.s3.${mediaRegion}.amazonaws.com` : ''

/** Public S3 URL of a stored file. Only meaningful when mediaPublicBase is set. */
export const publicMediaURL = (filename: string, prefix?: string) =>
  `${mediaPublicBase}/${[prefix, filename].filter(Boolean).map((p) => encodeURIComponent(p!)).join('/')}`
