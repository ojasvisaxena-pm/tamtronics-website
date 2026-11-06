import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'

// With S3_MEDIA_PUBLIC_READ=true, media URLs point straight at the S3 bucket (see payload.config.ts),
// so next/image must be allowed to fetch from it.
const mediaBucket = process.env.S3_MEDIA_BUCKET
const mediaRegion = process.env.S3_MEDIA_REGION || 'us-east-1'
const s3MediaPattern =
  mediaBucket && process.env.S3_MEDIA_PUBLIC_READ === 'true'
    ? [{ protocol: 'https' as const, hostname: `${mediaBucket}.s3.${mediaRegion}.amazonaws.com`, pathname: '/**' }]
    : []

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next's page cache, with CMS cache invalidations shared between server instances (Amplify runs
  // several). See cache-handler.mjs.
  cacheHandler: path.resolve(process.cwd(), 'cache-handler.mjs'),
  // File tracing misses sharp's native libraries, and without them the standalone server crashes.
  outputFileTracingIncludes: {
    '/**/*': ['./node_modules/sharp/**/*', './node_modules/@img/**/*'],
  },
  poweredByHeader: false,
  images: {
    // 90 keeps the supplied photos and app screens visually identical to the originals.
    qualities: [75, 90],
    formats: ['image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/assets/**' }],
    remotePatterns: s3MediaPattern,
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/home.html', destination: '/', permanent: true },
      // The original static site used /about.html; send those addresses (and old links) to /about.
      { source: '/:slug([^/.]+)\\.html', destination: '/:slug', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Website pages (HTML and the RSC data used for client navigation). Next.js would send
        // s-maxage=3600, and the CDN in front (CloudFront on Amplify) would keep serving that copy for
        // up to an hour after a CMS edit: only a deployment clears it. s-maxage=0 makes the CDN check
        // with the server on every request. The server answers from its own page cache, which the CMS
        // hooks clear on publish (src/lib/revalidate.ts), usually with a 304 when nothing changed.
        // Next.js keeps its stricter headers for draft previews and errors. Not applied to /_next
        // (hashed assets, images), /api, /admin or /assets, which keep their own caching.
        source: '/:path((?!(?:_next|api|admin|assets)(?:/|$)).*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' }],
      },
      {
        // Uploaded SVGs can carry scripts; this stops them running if opened directly.
        source: '/api/media/file/:file*.svg',
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; style-src 'unsafe-inline'; sandbox" }],
      },
    ]
  },
}

export default withPayload(nextConfig)