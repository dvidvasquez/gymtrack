import type { Profile } from '../../types/domain'
import { supabase } from '../supabaseClient'

interface ProfileRow {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? toProfile(data) : null
}

export async function createProfile(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId, display_name: displayName })
    .select('*')
    .single()

  if (error) throw error
  return toProfile(data)
}
