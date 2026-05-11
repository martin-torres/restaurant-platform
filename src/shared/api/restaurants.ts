import { supabase, getRestaurantIdFromUrl } from '../../lib/supabase'
import type { Restaurant } from '../../types'

export async function getRestaurant(): Promise<Restaurant | null> {
  const id = getRestaurantIdFromUrl()
  if (!id) return null

  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  return data as Restaurant | null
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  return data as Restaurant | null
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (data as Restaurant[]) || []
}
