import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

if (!import.meta.env.VITE_POCKETBASE_URL) {
  console.warn(
    'VITE_POCKETBASE_URL not set — defaulting to http://127.0.0.1:8090'
  )
}

/** App field → PocketBase relation field */
const RELATION_ALIASES: Record<string, string> = {
  restaurant_id: 'restaurant',
  table_id: 'table',
  floor_plan_id: 'floor_plan',
  menu_item_id: 'menu_item',
  order_id: 'order',
  staff_id: 'staff',
  linked_menu_item_id: 'linked_menu_item',
  assigned_staff_id: 'assigned_staff',
  processed_by: 'processed_by',
}

/** PocketBase relation field → app *_id field */
const RELATION_TO_APP: Record<string, string> = {
  restaurant: 'restaurant_id',
  table: 'table_id',
  floor_plan: 'floor_plan_id',
  menu_item: 'menu_item_id',
  order: 'order_id',
  staff: 'staff_id',
  linked_menu_item: 'linked_menu_item_id',
  assigned_staff: 'assigned_staff_id',
}

export function toPbRecord(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    const mapped = RELATION_ALIASES[key] || key
    if (key === 'created_at' || key === 'updated_at') continue
    // PocketBase optional relations: omit null rather than sending null
    if (value === null && RELATION_ALIASES[key]) continue
    out[mapped] = value
  }
  return out
}

export function fromPbRecord<T = any>(record: any): T {
  if (!record || typeof record !== 'object') return record as T
  const out: Record<string, any> = { ...record }
  out.created_at = record.created || record.created_at
  out.updated_at = record.updated || record.updated_at

  for (const [pbKey, appKey] of Object.entries(RELATION_TO_APP)) {
    if (pbKey in record) {
      const val = record[pbKey]
      out[appKey] = typeof val === 'object' && val?.id ? val.id : val
    }
  }

  // Flatten expand.order_items / expand style
  if (record.expand) {
    for (const [k, v] of Object.entries(record.expand)) {
      if (Array.isArray(v)) {
        out[k] = v.map((item) => fromPbRecord(item))
      } else if (v) {
        out[k] = fromPbRecord(v)
      }
    }
  }

  return out as T
}

export function escapeFilter(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
