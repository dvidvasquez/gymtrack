import type { Exercise, LogEntry } from '../../types/domain'
import { supabase } from '../supabaseClient'
import { toExercise, type ExerciseRow } from './exercises'

interface LogEntryRow {
  id: string
  user_id: string
  exercise_id: string
  weight_kg: number
  reps: number
  sets: number
  notes: string | null
  created_at: string
}

function toLogEntry(row: LogEntryRow): LogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    weightKg: row.weight_kg,
    reps: row.reps,
    sets: row.sets,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export async function getLastLogEntry(
  exerciseId: string,
  userId: string,
): Promise<LogEntry | null> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? toLogEntry(data) : null
}

interface CreateLogEntryInput {
  userId: string
  exerciseId: string
  weightKg: number
  reps: number
  sets: number
  notes: string | null
}

export async function createLogEntry(input: CreateLogEntryInput): Promise<LogEntry> {
  const { data, error } = await supabase
    .from('log_entries')
    .insert({
      user_id: input.userId,
      exercise_id: input.exerciseId,
      weight_kg: input.weightKg,
      reps: input.reps,
      sets: input.sets,
      notes: input.notes,
    })
    .select('*')
    .single()

  if (error) throw error
  return toLogEntry(data)
}

export async function getLogEntriesForExercise(
  exerciseId: string,
  userId: string,
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toLogEntry)
}

export interface LogEntryWithExercise {
  logEntry: LogEntry
  exercise: Exercise
}

interface LogEntryWithExerciseRow extends LogEntryRow {
  exercises: ExerciseRow | null
}

export async function getRecentLogEntries(
  userId: string,
  limit = 50,
): Promise<LogEntryWithExercise[]> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*, exercises(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return ((data ?? []) as LogEntryWithExerciseRow[])
    .filter((row) => row.exercises !== null)
    .map((row) => ({
      logEntry: toLogEntry(row),
      exercise: toExercise(row.exercises as ExerciseRow),
    }))
}
