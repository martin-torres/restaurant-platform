import { supabase } from '../../lib/supabase'
import type { StaffMember, StaffShift, StaffRole } from '../../types'

export async function getStaffMembers(restaurantId: string): Promise<StaffMember[]> {
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name')

  return (data as StaffMember[]) || []
}

export async function getStaffMemberById(id: string): Promise<StaffMember | null> {
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single()

  return data as StaffMember | null
}

export async function authenticateStaff(
  restaurantId: string,
  pin: string
): Promise<StaffMember | null> {
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('pin', pin)
    .eq('is_active', true)
    .single()

  return data as StaffMember | null
}

export async function createStaffMember(staff: {
  restaurant_id: string
  name: string
  role: StaffRole
  pin: string
}): Promise<StaffMember | null> {
  const { data, error } = await supabase
    .from('staff')
    .insert(staff)
    .select()
    .single()

  if (error) {
    console.error('Create staff error:', error)
    return null
  }

  await logStaffAction(data.id, 'staff_created', { name: staff.name, role: staff.role })
  return data as StaffMember
}

export async function updateStaffMember(
  id: string,
  updates: Partial<StaffMember>
): Promise<boolean> {
  const { error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Update staff error:', error)
    return false
  }

  await logStaffAction(id, 'staff_updated', updates)
  return true
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  // Soft delete - mark inactive
  const { error } = await supabase
    .from('staff')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Delete staff error:', error)
    return false
  }

  await logStaffAction(id, 'staff_deleted', {})
  return true
}

// ─── Shifts ───

export async function clockIn(staffId: string, restaurantId: string): Promise<StaffShift | null> {
  const { data, error } = await supabase
    .from('staff_shifts')
    .insert({
      staff_id: staffId,
      restaurant_id: restaurantId,
      clock_in: new Date().toISOString(),
      tables_served: 0,
      total_tips: 0,
      total_sales: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Clock in error:', error)
    return null
  }

  await logStaffAction(staffId, 'shift_start', { shift_id: data.id })
  return data as StaffShift
}

export async function clockOut(shiftId: string, staffId: string): Promise<boolean> {
  const { error } = await supabase
    .from('staff_shifts')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', shiftId)

  if (error) {
    console.error('Clock out error:', error)
    return false
  }

  await logStaffAction(staffId, 'shift_end', { shift_id: shiftId })
  return true
}

export async function getActiveShift(staffId: string): Promise<StaffShift | null> {
  const { data } = await supabase
    .from('staff_shifts')
    .select('*')
    .eq('staff_id', staffId)
    .is('clock_out', null)
    .single()

  return data as StaffShift | null
}

export async function getShiftsForStaff(
  staffId: string,
  limit = 20
): Promise<StaffShift[]> {
  const { data } = await supabase
    .from('staff_shifts')
    .select('*')
    .eq('staff_id', staffId)
    .order('clock_in', { ascending: false })
    .limit(limit)

  return (data as StaffShift[]) || []
}

// ─── Staff Actions Logging ───

export async function logStaffAction(
  staffId: string,
  actionType: string,
  details: Record<string, any> = {}
): Promise<void> {
  await supabase.from('staff_actions').insert({
    staff_id: staffId,
    action_type: actionType,
    details,
  }).maybeSingle()
}

export async function getStaffActions(
  restaurantId: string,
  limit = 50
): Promise<any[]> {
  const { data } = await supabase
    .from('staff_actions')
    .select('*, staff:staff_id(name, role)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function subscribeToStaff(
  restaurantId: string,
  callback: (staff: StaffMember) => void
) {
  return supabase
    .channel('staff-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'staff',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        callback(payload.new as StaffMember)
      }
    )
    .subscribe()
}
