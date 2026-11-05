import type { Access, FieldAccess } from 'payload'

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminField: FieldAccess = ({ req }) => req.user?.role === 'admin'

export const isLoggedInField: FieldAccess = ({ req }) => Boolean(req.user)

export const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  return req.user.role === 'admin' ? true : { id: { equals: req.user.id } }
}

/** Visitors only ever see published versions; signed-in editors can also read drafts. */
export const publishedOrLoggedIn: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }
