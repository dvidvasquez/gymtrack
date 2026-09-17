import type { Exercise } from '../../types/domain'
import { supabase } from '../supabaseClient'

export interface ExerciseRow {
  id: string
  name: string
  qr_code: string | null
  muscle_group: string | null
  created_at: string
}

export function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    qrCode: row.qr_code,
    muscleGroup: row.muscle_group,
    createdAt: row.created_at,
  }
}

export async function getExerciseByQrCode(qrCode: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle()

  if (error) throw error
  return data ? toExercise(data) : null
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? toExercise(data) : null
}

export async function getAllExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name')

  if (error) throw error
  return (data ?? []).map(toExercise)
}

export interface ExerciseInput {
  name: string
  muscleGroup: string | null
  qrCode: string | null
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name: input.name, muscle_group: input.muscleGroup, qr_code: input.qrCode })
    .select('*')
    .single()

  if (error) throw error
  return toExercise(data)
}

export async function updateExercise(id: string, input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update({ name: input.name, muscle_group: input.muscleGroup, qr_code: input.qrCode })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return toExercise(data)
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}
