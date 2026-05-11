// @ts-nocheck
import { createClient } from '@insforge/sdk'
import { md5 } from 'js-md5'

// ─── Configuration ────────────────────────────────────────────────────────────

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL || ''
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || ''

if (!insforgeUrl || !insforgeAnonKey) {
  console.warn(
    'InsForge credentials not found. Set VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY in .env'
  )
}

// ─── Client ───────────────────────────────────────────────────────────────────

const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
})

// ─── Database proxy ──────────────────────────────────────────────────────────

// InsForge SDK returns a Postgrest query builder from .from().
// Only .insert() needs wrapping — it expects an array for batch inserts,
// but callers pass single objects.
function wrapInsert(qb: any) {
  const originalInsert = qb.insert.bind(qb)
  qb.insert = (value: any) => {
    return originalInsert(Array.isArray(value) ? value : [value])
  }
  return qb
}

// ─── Realtime channel adapter ────────────────────────────────────────────────
// Maps Supabase-style postgres_changes protocol to InsForge's channel model.
//
// Supabase:  .on('postgres_changes', { event, schema, table, filter }, cb)
// InsForge:  .on(channelName, (msg) => ...)
//
// Channel naming:  db:{schema}:{table}  (e.g. db:public:orders)

function createChannel(name: string) {
  const handlers: Array<{
    event: string
    config: any
    callback: (payload: any) => void
  }> = []

  /** Convert raw InsForge message to Supabase-compatible envelope */
  function envelope(raw: any, inferredEvent: string) {
    // InsForge may deliver the record directly or wrapped
    const record = raw?.record ?? raw?.payload ?? raw
    const eventType = (raw?.type ?? raw?.event ?? inferredEvent).toUpperCase()
    return { eventType, new: record, old: null }
  }

  return {
    on(_type: string, config: any, callback: (payload: any) => void) {
      handlers.push({ event: _type, config, callback })
      return this
    },

    subscribe() {
      // Resolve InsForge channel name from config table or fall back to given name
      const tableName = handlers[0]?.config?.table
      const channelName = tableName ? `db:public:${tableName}` : name

      insforge.realtime.subscribe(channelName).catch((e: any) =>
        console.warn(`Realtime subscribe failed for ${channelName}:`, e)
      )

      // Forward InsForge messages to all registered Supabase-style handlers
      const handler = (msg: any) => {
        const env = envelope(msg, 'INSERT')
        for (const h of handlers) {
          h.callback(env)
        }
      }
      insforge.realtime.on(channelName, handler as any)

      return { unsubscribe: () => insforge.realtime.unsubscribe(channelName) }
    },

    /** Unsubscribe without calling .subscribe() first (used by removeChannel) */
    _unsubscribe() {
      const tableName = handlers[0]?.config?.table
      const channelName = tableName ? `db:public:${tableName}` : name
      insforge.realtime.unsubscribe(channelName)
    },
  }
}

// ─── Supabase-compatible facade ──────────────────────────────────────────────

export const supabase = {
  from(table: string) {
    return wrapInsert(insforge.database.from(table))
  },

  rpc(fn: string, params?: Record<string, any>) {
    return insforge.database.rpc(fn, params)
  },

  channel(name: string) {
    return createChannel(name)
  },

  /** Remove a realtime subscription by channel name or subscription ref */
  removeChannel(channel: any) {
    if (typeof channel === 'string') {
      insforge.realtime.unsubscribe(channel)
    } else if (typeof channel?._unsubscribe === 'function') {
      channel._unsubscribe()
    } else if (typeof channel?.unsubscribe === 'function') {
      channel.unsubscribe()
    }
  },

  auth: {
    getSession: async () => {
      try {
        const { data: user, error } = await insforge.auth.getCurrentUser()
        if (!user || error) {
          return { data: { session: null }, error: null }
        }
        // Wrap in Supabase-compatible session shape
        return {
          data: {
            session: {
              user,
              access_token: user.accessToken ?? null,
              provider: 'insforge',
            },
          },
          error: null,
        }
      } catch {
        return { data: { session: null }, error: null }
      }
    },

    signInWithPassword: async (credentials: {
      email: string
      password: string
    }) => {
      return insforge.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
    },

    signOut: async () => {
      return insforge.auth.signOut()
    },

    onAuthStateChange: () => {
      // InsForge doesn't expose a native auth listener yet.
      // Return a no-op subscription to match the Supabase interface.
      console.warn('onAuthStateChange is a no-op — InsForge auth events not wired')
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    },

    // Expose the underlying InsForge auth for advanced usage
    _insforgeAuth: insforge.auth,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function stringIdToUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(id)) return id

  const hash = md5(id)
  return (
    hash.substring(0, 8) +
    '-' +
    hash.substring(8, 12) +
    '-' +
    hash.substring(12, 16) +
    '-' +
    hash.substring(16, 20) +
    '-' +
    hash.substring(20)
  )
}

export function getRestaurantIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('restaurant_id')
  if (!id) return null
  return stringIdToUuid(id)
}

export function getQrTypeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('qr_type')
}