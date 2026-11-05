export const HOME_SLUG = 'home'

/** Pages live at /platform, with the home page at /. The original site's /platform.html redirects here. */
export const pagePath = (slug: string) => (slug === HOME_SLUG ? '/' : `/${slug}`)

/** Slugs that would collide with the app's own routes. */
export const RESERVED_SLUGS = ['admin', 'api', 'preview', 'assets', 'media', 'sitemap', 'robots']
