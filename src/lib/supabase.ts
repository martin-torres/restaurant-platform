/**
 * Database client — PocketBase backend with a Supabase-style query facade.
 * Existing API modules keep calling `supabase.from(...).select().eq()`, while
 * records are stored in PocketBase collections.
 */
import { md5 } from 'js-md5'
import {
  pb,
  toPbRecord,
  fromPbRecord,
  escapeFilter,
} from './pocketbase'

type Filter = { field: string; op: string; value: any }

class QueryBuilder {
  private table: string
  private filters: Filter[] = []
  private orderField: string | null = null
  private orderAsc = true
  private limitN: number | null = null
  private wantSingle = false
  private wantMaybeSingle = false
  private selectSpec = '*'
  private mutate: null | { type: 'insert' | 'update' | 'delete'; payload?: any } = null

  constructor(table: string) {
    this.table = table
  }

  select(_columns?: string) {
    if (_columns) this.selectSpec = _columns
    return this
  }

  insert(value: any) {
    this.mutate = { type: 'insert', payload: value }
    return this
  }

  update(value: any) {
    this.mutate = { type: 'update', payload: value }
    return this
  }

  delete() {
    this.mutate = { type: 'delete' }
    return this
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: '=', value })
    return this
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: '!=', value })
    return this
  }

  is(field: string, value: any) {
    this.filters.push({ field, op: 'is', value })
    return this
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values })
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAsc = opts?.ascending !== false
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.wantSingle = true
    return this.execute()
  }

  maybeSingle() {
    this.wantMaybeSingle = true
    return this.execute()
  }

  // Make the builder a proper PromiseLike so `await supabase.from(...).eq(...)` works
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | null
      | undefined
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected ?? undefined)
  }

  private mapField(field: string): string {
    const aliases: Record<string, string> = {
      restaurant_id: 'restaurant',
      table_id: 'table',
      floor_plan_id: 'floor_plan',
      menu_item_id: 'menu_item',
      order_id: 'order',
      staff_id: 'staff',
      linked_menu_item_id: 'linked_menu_item',
      assigned_staff_id: 'assigned_staff',
      created_at: 'created',
      updated_at: 'updated',
    }
    return aliases[field] || field
  }

  private buildFilter(): string {
    // PocketBase filter language — OR-chain for `in`
    return this.filters
      .map((f) => {
        const field = this.mapField(f.field)
        if (f.op === 'in') {
          return (
            '(' +
            (f.value as any[])
              .map((v) =>
                typeof v === 'string'
                  ? `${field}="${escapeFilter(v)}"`
                  : `${field}=${v}`
              )
              .join(' || ') +
            ')'
          )
        }
        if (f.op === 'is' && f.value === null) return `${field}=null`
        if (typeof f.value === 'string') {
          return `${field}${f.op === '!=' ? '!=' : '='}"${escapeFilter(f.value)}"`
        }
        if (f.value === null) return `${field}=null`
        if (typeof f.value === 'boolean') return `${field}=${f.value}`
        return `${field}${f.op === '!=' ? '!=' : '='}${f.value}`
      })
      .join(' && ')
  }

  private async attachNested(records: any[]): Promise<any[]> {
    // Support select('*, items:order_items(*)') and staff joins
    const wantsItems =
      this.selectSpec.includes('items:order_items') ||
      this.selectSpec.includes('order_items')
    const wantsStaff =
      this.selectSpec.includes('staff:staff_id') ||
      this.selectSpec.includes('staff(')

    if (!wantsItems && !wantsStaff) {
      return records.map((r) => fromPbRecord(r))
    }

    const mapped = records.map((r) => fromPbRecord(r))

    if (wantsItems && this.table === 'orders') {
      await Promise.all(
        mapped.map(async (order) => {
          try {
            // Do not sort by system `created` — PocketBase returns 400 on that sort here.
            const items = await pb.collection('order_items').getFullList({
              filter: `order="${order.id}"`,
            })
            order.items = items.map((i) => fromPbRecord(i))
          } catch {
            order.items = []
          }
        })
      )
    }

    if (wantsStaff) {
      await Promise.all(
        mapped.map(async (row) => {
          const staffId = row.staff_id
          if (!staffId) return
          try {
            const staff = await pb.collection('staff').getOne(staffId)
            row.staff = fromPbRecord(staff)
          } catch {
            /* ignore */
          }
        })
      )
    }

    return mapped
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      if (this.mutate?.type === 'insert') {
        const raw = this.mutate.payload
        const rows = Array.isArray(raw) ? raw : [raw]
        const created = []
        for (const row of rows) {
          const record = await pb
            .collection(this.table)
            .create(toPbRecord(row))
          created.push(fromPbRecord(record))
        }
        // Nested items not inserted here — callers insert order_items separately
        if (this.wantSingle || this.wantMaybeSingle) {
          return { data: created[0] ?? null, error: null }
        }
        return { data: created, error: null }
      }

      if (this.mutate?.type === 'update') {
        const filter = this.buildFilter()
        const list = await pb.collection(this.table).getFullList({ filter })
        if (list.length === 0) {
          return {
            data: this.wantSingle ? null : [],
            error: this.wantSingle
              ? { message: 'No rows affected' }
              : null,
          }
        }
        const updated = []
        for (const row of list) {
          const record = await pb
            .collection(this.table)
            .update(row.id, toPbRecord(this.mutate.payload || {}))
          updated.push(fromPbRecord(record))
        }
        if (this.wantSingle || this.wantMaybeSingle) {
          return { data: updated[0] ?? null, error: null }
        }
        return { data: updated, error: null }
      }

      if (this.mutate?.type === 'delete') {
        const filter = this.buildFilter()
        const list = await pb.collection(this.table).getFullList({ filter })
        for (const row of list) {
          await pb.collection(this.table).delete(row.id)
        }
        return { data: null, error: null }
      }

      // SELECT
      const filter = this.buildFilter()
      // PocketBase rejects sort on system created/updated in some builds — sort in JS instead.
      const needsClientSort =
        this.orderField === 'created_at' ||
        this.orderField === 'updated_at' ||
        this.orderField === 'created' ||
        this.orderField === 'updated'
      const sortField =
        this.orderField && !needsClientSort
          ? `${this.orderAsc ? '' : '-'}${this.mapField(this.orderField)}`
          : undefined

      if (this.wantSingle || this.wantMaybeSingle) {
        try {
          const opts: any = {}
          if (sortField) opts.sort = sortField
          const record = await pb
            .collection(this.table)
            .getFirstListItem(filter || '', opts)
          const [mapped] = await this.attachNested([record])
          return { data: mapped, error: null }
        } catch (err: any) {
          if (this.wantMaybeSingle) return { data: null, error: null }
          return {
            data: null,
            error: { message: err?.message || 'Not found', code: err?.status },
          }
        }
      }

      const options: any = {}
      if (filter) options.filter = filter
      if (sortField) options.sort = sortField

      let records: any[]
      if (this.limitN != null) {
        const page = await pb.collection(this.table).getList(1, this.limitN, options)
        records = page.items
      } else {
        records = await pb.collection(this.table).getFullList(options)
      }

      if (needsClientSort && this.orderField) {
        const key = this.mapField(this.orderField)
        const asc = this.orderAsc
        records = [...records].sort((a, b) => {
          const av = a[key] || a.created || ''
          const bv = b[key] || b.created || ''
          if (av === bv) return 0
          return asc ? (av < bv ? -1 : 1) : av < bv ? 1 : -1
        })
      }

      const mapped = await this.attachNested(records)
      return { data: mapped, error: null }
    } catch (err: any) {
      console.error(`[db:${this.table}]`, err?.message || err)
      return {
        data: null,
        error: {
          message: err?.message || 'Database error',
          data: err?.data,
          status: err?.status,
        },
      }
    }
  }
}

function createChannel(name: string) {
  const handlers: Array<{
    config: any
    callback: (payload: any) => void
  }> = []
  let unsub: (() => void) | null = null

  return {
    on(_type: string, config: any, callback: (payload: any) => void) {
      handlers.push({ config, callback })
      return this
    },

    subscribe() {
      const table = handlers[0]?.config?.table || 'orders'

      const promise = pb
        .collection(table)
        .subscribe('*', (e) => {
          const eventType =
            e.action === 'create'
              ? 'INSERT'
              : e.action === 'update'
                ? 'UPDATE'
                : e.action === 'delete'
                  ? 'DELETE'
                  : String(e.action || '').toUpperCase()
          const record = fromPbRecord(e.record)
          const filter = handlers[0]?.config?.filter as string | undefined
          if (filter && filter.includes('restaurant_id=eq.')) {
            const rid = filter.split('restaurant_id=eq.')[1]
            if (rid && record.restaurant_id && record.restaurant_id !== rid) return
          }
          if (filter && filter.startsWith('id=eq.')) {
            const id = filter.slice('id=eq.'.length)
            if (record.id !== id) return
          }
          for (const h of handlers) {
            h.callback({ eventType, new: record, old: null })
          }
        })
        .catch((err) => {
          console.warn(`Realtime subscribe failed for ${table}:`, err)
          return () => {}
        })

      unsub = () => {
        promise.then((u) => {
          if (typeof u === 'function') u()
        })
      }

      return {
        unsubscribe: () => {
          if (unsub) unsub()
        },
      }
    },

    _unsubscribe() {
      if (unsub) unsub()
      try {
        pb.collection(handlers[0]?.config?.table || 'orders').unsubscribe('*')
      } catch {
        /* ignore */
      }
    },
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table)
  },

  rpc(_fn: string, _params?: Record<string, any>) {
    console.warn('rpc() is not implemented on PocketBase facade')
    return Promise.resolve({ data: null, error: { message: 'rpc not supported' } })
  },

  channel(name: string) {
    return createChannel(name)
  },

  removeChannel(channel: any) {
    if (typeof channel === 'string') {
      try {
        pb.collection(channel).unsubscribe()
      } catch {
        /* ignore */
      }
    } else if (typeof channel?._unsubscribe === 'function') {
      channel._unsubscribe()
    } else if (typeof channel?.unsubscribe === 'function') {
      channel.unsubscribe()
    }
  },

  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({
      data: { session: null },
      error: { message: 'Use staff/owner PIN login' },
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
}

export function stringIdToUuid(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(id)) return id
  // PocketBase ids are 15-char alphanumeric — pass through
  if (/^[a-z0-9]{15}$/i.test(id)) return id
  // Slugs and legacy string ids — caller should resolve via lookup
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

/**
 * Resolve restaurant id from URL. Accepts:
 * - PocketBase record id (15 chars)
 * - slug (e.g. di-pasquale)
 * - legacy string ids (r_dipasquale) — resolved async by callers via slug
 */
export function getRestaurantIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('restaurant_id')
}

export function getQrTypeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('qr_type')
}

/** Resolve a restaurant_id query value (id or slug) to a PocketBase record id. */
export async function resolveRestaurantId(
  raw: string | null
): Promise<string | null> {
  if (!raw) return null
  if (/^[a-z0-9]{15}$/i.test(raw)) return raw
  try {
    const bySlug = await pb
      .collection('restaurants')
      .getFirstListItem(`slug="${escapeFilter(raw)}"`)
    return bySlug.id
  } catch {
    // try legacy slug forms: r_dipasquale → di-pasquale
    const normalized = raw.replace(/^r_/, '').replace(/_/g, '-')
    try {
      const bySlug = await pb
        .collection('restaurants')
        .getFirstListItem(`slug="${escapeFilter(normalized)}"`)
      return bySlug.id
    } catch {
      return raw
    }
  }
}
