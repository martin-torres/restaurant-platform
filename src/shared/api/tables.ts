import { supabase } from '../../lib/supabase'
import type { RestaurantTable, FloorPlan, FloorProp, TableShape, PropShape } from '../../types'

// ─── Floor Plans ───

export async function getFloorPlan(restaurantId: string): Promise<FloorPlan | null> {
  const { data } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .single()

  return data as FloorPlan | null
}

export async function createFloorPlan(fp: {
  restaurant_id: string
  canvas_w: number
  canvas_h: number
  grid_size: number
}): Promise<FloorPlan | null> {
  const { data, error } = await supabase
    .from('floor_plans')
    .insert(fp)
    .select()
    .single()

  if (error) {
    console.error('Create floor plan error:', error)
    return null
  }
  return data as FloorPlan
}

export async function updateFloorPlan(
  id: string,
  updates: Partial<FloorPlan>
): Promise<boolean> {
  const { error } = await supabase
    .from('floor_plans')
    .update(updates)
    .eq('id', id)

  return !error
}

// ─── Tables ───

export async function getTables(restaurantId: string): Promise<RestaurantTable[]> {
  const { data } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('table_number')

  return (data as RestaurantTable[]) || []
}

export async function getTable(id: string): Promise<RestaurantTable | null> {
  const { data } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('id', id)
    .single()

  return data as RestaurantTable | null
}

export async function createTable(table: {
  restaurant_id: string
  floor_plan_id?: string
  display_name: string
  table_number: number
  seats: number
  shape: TableShape
  x: number
  y: number
  width: number
  height: number
  rotation: number
  chair_positions: { seat_number: number; x: number; y: number; rotation?: number }[]
}): Promise<RestaurantTable | null> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert(table)
    .select()
    .single()

  if (error) {
    console.error('Create table error:', error)
    return null
  }
  return data as RestaurantTable
}

export async function updateTable(
  id: string,
  updates: Partial<RestaurantTable>
): Promise<boolean> {
  const { error } = await supabase
    .from('restaurant_tables')
    .update(updates)
    .eq('id', id)

  return !error
}

export async function deleteTable(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)

  return !error
}

export async function subscribeToTables(
  restaurantId: string,
  callback: (table: RestaurantTable) => void
) {
  return supabase
    .channel('tables-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'restaurant_tables',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        callback(payload.new as RestaurantTable)
      }
    )
    .subscribe()
}

// ─── Floor Props ───

export async function getFloorProps(restaurantId: string): Promise<FloorProp[]> {
  const { data } = await supabase
    .from('floor_props')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('prop_type')

  return (data as FloorProp[]) || []
}

export async function createFloorProp(prop: {
  restaurant_id: string
  floor_plan_id?: string
  prop_type: FloorProp['prop_type']
  label?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  display_name?: string
  shape?: FloorProp['shape'] | PropShape
  seats?: number
  chair_positions?: { seat_number: number; x: number; y: number; rotation?: number }[]
  is_interactive?: boolean
  visible_to_customers?: boolean
  is_available?: boolean
  is_reserved?: boolean
  status_color?: string
  secondary_color?: string
}): Promise<FloorProp | null> {
  const { data, error } = await supabase
    .from('floor_props')
    .insert(prop)
    .select()
    .single()

  if (error) {
    console.error('Create prop error:', error)
    return null
  }
  return data as FloorProp
}

export async function updateFloorProp(
  id: string,
  updates: Partial<FloorProp>
): Promise<boolean> {
  const { error } = await supabase
    .from('floor_props')
    .update(updates)
    .eq('id', id)

  return !error
}

export async function deleteFloorProp(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('floor_props')
    .delete()
    .eq('id', id)

  return !error
}

// ─── Chair position helpers ───

export function autoGenerateChairPositions(
  shape: TableShape | PropShape,
  seats: number,
  width: number,
  height: number
): { seat_number: number; x: number; y: number; rotation?: number }[] {
  const chairs: { seat_number: number; x: number; y: number; rotation?: number }[] = []
  const inset = 8

  switch (shape) {
    case 'circle': {
      const radius = Math.min(width, height) / 2 + inset + 12
      const cx = width / 2
      const cy = height / 2
      for (let i = 0; i < seats; i++) {
        const angle = (2 * Math.PI * i) / seats - Math.PI / 2
        chairs.push({
          seat_number: i + 1,
          x: cx + radius * Math.cos(angle) - 5,
          y: cy + radius * Math.sin(angle) - 5,
          rotation: (angle * 180) / Math.PI + 90,
        })
      }
      break
    }
    case 'square': {
      const perSide = Math.max(1, Math.floor(seats / 4))
      const positions: [number, number][] = []
      // Top
      for (let i = 0; i < perSide; i++) {
        positions.push([(width / (perSide + 1)) * (i + 1), -inset - 10])
      }
      // Bottom
      for (let i = 0; i < perSide; i++) {
        positions.push([(width / (perSide + 1)) * (i + 1), height + inset + 10])
      }
      // Left
      for (let i = 0; i < perSide; i++) {
        positions.push([-inset - 10, (height / (perSide + 1)) * (i + 1)])
      }
      // Right
      for (let i = 0; i < perSide; i++) {
        positions.push([width + inset + 10, (height / (perSide + 1)) * (i + 1)])
      }
      positions.slice(0, seats).forEach(([x, y], idx) => {
        chairs.push({ seat_number: idx + 1, x, y })
      })
      break
    }
    case 'rectangle':
    case 'rect': {
      const seatsPerLong = Math.max(2, Math.floor(seats / 2))
      for (let i = 0; i < seatsPerLong; i++) {
        chairs.push({ seat_number: i + 1, x: (width / (seatsPerLong + 1)) * (i + 1), y: -inset - 10 })
        chairs.push({
          seat_number: i + 1 + seatsPerLong,
          x: (width / (seatsPerLong + 1)) * (i + 1),
          y: height + inset + 10,
        })
      }
      // If odd seats, add one at an end
      if (seats > seatsPerLong * 2) {
        chairs.push({ seat_number: seats, x: -inset - 10, y: height / 2 })
      }
      break
    }
    case 'booth_u': {
      // Booth seats along three sides
      const perSide = Math.max(1, Math.ceil(seats / 3))
      for (let i = 0; i < perSide && chairs.length < seats; i++) {
        chairs.push({ seat_number: chairs.length + 1, x: (width / (perSide + 1)) * (i + 1), y: -inset - 8 })
      }
      for (let i = 0; i < perSide && chairs.length < seats; i++) {
        chairs.push({ seat_number: chairs.length + 1, x: -inset - 8, y: (height / (perSide + 1)) * (i + 1) })
      }
      for (let i = 0; i < perSide && chairs.length < seats; i++) {
        chairs.push({
          seat_number: chairs.length + 1,
          x: (width / (perSide + 1)) * (i + 1),
          y: height + inset + 8,
        })
      }
      break
    }
    case 'booth_half_u': {
      const perSideH = Math.max(1, Math.ceil(seats / 2))
      for (let i = 0; i < perSideH && chairs.length < seats; i++) {
        chairs.push({ seat_number: chairs.length + 1, x: (width / (perSideH + 1)) * (i + 1), y: -inset - 8 })
      }
      for (let i = 0; i < perSideH && chairs.length < seats; i++) {
        chairs.push({
          seat_number: chairs.length + 1,
          x: (width / (perSideH + 1)) * (i + 1),
          y: height + inset + 8,
        })
      }
      break
    }
    case 'bar': {
      // Bar stools along one side
      for (let i = 0; i < seats; i++) {
        chairs.push({
          seat_number: i + 1,
          x: (width / (seats + 1)) * (i + 1),
          y: -inset - 12,
        })
      }
      break
    }
  }

  return chairs
}

export function getDefaultSeatsForShape(shape: TableShape | PropShape): number {
  switch (shape) {
    case 'circle': return 4
    case 'square': return 4
    case 'rectangle': return 6
    case 'rect': return 6
    case 'booth_u': return 6
    case 'booth_half_u': return 4
    case 'bar': return 4
  }
}
