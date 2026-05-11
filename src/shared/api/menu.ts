import { supabase } from '../../lib/supabase'
import type { MenuItem } from '../../types'

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('sort_order')

  return (data as MenuItem[]) || []
}

export async function getMenuItemsByCategory(
  restaurantId: string
): Promise<Record<string, MenuItem[]>> {
  const items = await getMenuItems(restaurantId)
  return items.reduce(
    (acc, item) => {
      const cat = item.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>
  )
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()

  return data as MenuItem | null
}
