import { notFound } from 'next/navigation'

/** Pages are one level deep; this sends longer paths to the site's own 404 page. */
export default function DeepPath() {
  notFound()
}
