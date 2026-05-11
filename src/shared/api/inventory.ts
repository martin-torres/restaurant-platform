import { supabase } from '../../lib/supabase'
import type { InventoryItem } from '../../types'

export async function getInventoryItems(restaurantId: string): Promise<InventoryItem[]> {
  const { data } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name')

  return (data as InventoryItem[]) || []
}

export async function createInventoryItem(item: {
  restaurant_id: string
  name: string
  unit: string
  stock: number
  min_stock: number
  cost_per_unit: number
  linked_menu_item_id?: string
}): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Create inventory error:', error)
    return null
  }
  return data as InventoryItem
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)

  return !error
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  return !error
}
