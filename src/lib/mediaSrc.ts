/**
 * The src to give next/image for a Payload media URL.
 *
 * Payload prefixes file URLs with serverURL (NEXT_PUBLIC_SERVER_URL), so files served through
 * /api/media/file come back as e.g. http://localhost:3000/api/media/file/logo.png. next/image only
 * allows those as relative paths (images.localPatterns in next.config.ts), so this site's own origin
 * is stripped. Other URLs, such as public S3 URLs, are returned unchanged.
 *
 * Safe in client components: NEXT_PUBLIC_SERVER_URL is inlined at build time.
 */
export function mediaSrc(url: string): string {
  const server = process.env.NEXT_PUBLIC_SERVER_URL
  if (!server || !url.startsWith(server)) return url
  const rest = url.slice(server.replace(/\/+$/, '').length)
  return rest.startsWith('/api/media/file/') ? rest : url
}
