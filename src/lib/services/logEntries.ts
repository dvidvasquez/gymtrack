import type { LogEntry } from '../../types/domain'
import { supabase } from '../supabaseClient'

interface LogEntryRow {
  id: string
  user_id: string
  machine_id: string
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
    machineId: row.machine_id,
    weightKg: row.weight_kg,
    reps: row.reps,
    sets: row.sets,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export async function getLastLogEntry(
  machineId: string,
  userId: string,
): Promise<LogEntry | null> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('machine_id', machineId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? toLogEntry(data) : null
}

interface CreateLogEntryInput {
  userId: string
  machineId: string
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
      machine_id: input.machineId,
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
