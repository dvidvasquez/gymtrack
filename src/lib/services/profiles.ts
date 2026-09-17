import type { Profile } from '../../types/domain'
import { supabase } from '../supabaseClient'

interface ProfileRow {
  id: string
  user_id: string
  display_name: string
  weight_kg: number | null
  height_cm: number | null
  birth_date: string | null
  role: 'owner' | 'member'
  created_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    birthDate: row.birth_date,
    role: row.role,
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

export interface ProfileDetailsInput {
  displayName: string
  weightKg: number
  heightCm: number
  birthDate: string
}

export async function createProfile(userId: string, input: ProfileDetailsInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: input.displayName,
      weight_kg: input.weightKg,
      height_cm: input.heightCm,
      birth_date: input.birthDate,
    })
    .select('*')
    .single()

  if (error) throw error
  return toProfile(data)
}

export async function updateProfile(userId: string, input: ProfileDetailsInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      weight_kg: input.weightKg,
      height_cm: input.heightCm,
      birth_date: input.birthDate,
    })
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return toProfile(data)
}
