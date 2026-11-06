/**
 * Next.js page cache (ISR) handler: Next's own file-system and memory cache, plus cache invalidations
 * shared between server instances through MongoDB.
 *
 * Why: AWS Amplify runs the site on several short-lived server instances, each with its own page cache.
 * revalidatePath() in the CMS hooks (src/lib/revalidate.ts) only clears the cache of the instance that
 * handled the save, so other instances kept serving the old page for up to an hour.
 *
 * How: when a cache tag is invalidated, the time is also written to MongoDB. Before reading a cached
 * page, each instance checks MongoDB for invalidations newer than the ones it has applied (at most once
 * a second) and applies them to its own cache, so the next request re-renders the page.
 *
 * Only invalidation times are shared; pages stay cached in each instance's memory and disk as before.
 * The records live in Payload's key-value collection (`payload-kvs`) in the same { key, data } shape
 * Payload uses, so no new collection is needed. If MongoDB can't be reached, this behaves exactly like
 * Next's default cache and logs the error.
 *
 * Plain JavaScript: Next.js loads this file directly at runtime; it isn't compiled with the app.
 * Registered in next.config.ts (cacheHandler). Written for Next.js 16.4 (FileSystemCache API).
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const FileSystemCache = require('next/dist/server/lib/incremental-cache/file-system-cache.js').default
const { MongoClient } = require('mongodb')

const COLLECTION = 'payload-kvs'
const KEY_PREFIX = 'next-cache:revalidated-tag:'
const SYNC_INTERVAL_MS = 1000
// After a failed read, wait this long before trying again, so an outage doesn't slow every request.
const RETRY_AFTER_ERROR_MS = 30_000
const ERROR_LOG_INTERVAL_MS = 60_000

// Next.js creates a handler per request, so shared state lives on the module (one per server process).
const state = {
  clientPromise: null,
  /** tag -> invalidation time (ms) already applied to this instance's cache */
  applied: new Map(),
  lastSync: 0,
  syncing: null,
  lastErrorLog: 0,
}

const logError = (message, err) => {
  const now = Date.now()
  if (now - state.lastErrorLog < ERROR_LOG_INTERVAL_MS) return
  state.lastErrorLog = now
  console.error(`[cache-handler] ${message}:`, err instanceof Error ? err.message : err)
}

const collection = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) return null
  if (!state.clientPromise) {
    state.clientPromise = new MongoClient(uri, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      appName: 'next-cache-handler',
    })
      .connect()
      .catch((err) => {
        state.clientPromise = null
        throw err
      })
  }
  return (await state.clientPromise).db().collection(COLLECTION)
}

export default class SharedInvalidationCache extends FileSystemCache {
  constructor(ctx) {
    super(ctx)
    // Caching is off in development, and the build has nothing to share yet.
    this.shareInvalidations = !ctx.dev && process.env.NEXT_PHASE !== 'phase-production-build'
  }

  async get(...args) {
    if (this.shareInvalidations) await this.applyRemoteInvalidations()
    return super.get(...args)
  }

  async revalidateTag(tags, durations) {
    await super.revalidateTag(tags, durations)
    const list = (typeof tags === 'string' ? [tags] : tags ?? []).filter(Boolean)
    if (!this.shareInvalidations || list.length === 0) return

    const at = Date.now()
    for (const tag of list) state.applied.set(tag, Math.max(state.applied.get(tag) ?? 0, at))
    try {
      const col = await collection()
      if (!col) return
      const now = new Date()
      // Awaited: Next.js finishes pending revalidations before it sends the response, so this is
      // written even on Amplify, where the instance is frozen once the response is sent.
      await col.bulkWrite(
        list.map((tag) => ({
          updateOne: {
            filter: { key: KEY_PREFIX + tag },
            update: { $max: { 'data.revalidatedAt': at }, $set: { updatedAt: now }, $setOnInsert: { createdAt: now } },
            upsert: true,
          },
        })),
        { ordered: false },
      )
    } catch (err) {
      logError('could not share a cache invalidation; other server instances may show old pages for up to an hour', err)
    }
  }

  /** Applies invalidations made by other instances. Runs at most once a second; concurrent calls share one query. */
  async applyRemoteInvalidations() {
    if (Date.now() - state.lastSync < SYNC_INTERVAL_MS) return
    if (state.syncing) return state.syncing
    state.lastSync = Date.now()
    state.syncing = (async () => {
      try {
        const col = await collection()
        if (!col) return
        const docs = await col
          .find({ key: { $regex: `^${KEY_PREFIX}` } }, { projection: { _id: 0, key: 1, 'data.revalidatedAt': 1 } })
          .toArray()
        const newer = []
        for (const doc of docs) {
          const tag = doc.key.slice(KEY_PREFIX.length)
          const at = doc.data?.revalidatedAt
          if (typeof at === 'number' && at > (state.applied.get(tag) ?? 0)) {
            newer.push(tag)
            state.applied.set(tag, at)
          }
        }
        // Marks the tags expired now in this instance, so pages cached before now are re-rendered.
        if (newer.length) await super.revalidateTag(newer)
      } catch (err) {
        state.lastSync = Date.now() + RETRY_AFTER_ERROR_MS - SYNC_INTERVAL_MS
        logError('could not read shared cache invalidations; serving this instance\'s cache', err)
      } finally {
        state.syncing = null
      }
    })()
    return state.syncing
  }
}
