import type { Machine } from '../../types/domain'
import { supabase } from '../supabaseClient'

export interface MachineRow {
  id: string
  name: string
  qr_code: string
  muscle_group: string | null
  created_at: string
}

export function toMachine(row: MachineRow): Machine {
  return {
    id: row.id,
    name: row.name,
    qrCode: row.qr_code,
    muscleGroup: row.muscle_group,
    createdAt: row.created_at,
  }
}

export async function getMachineByQrCode(qrCode: string): Promise<Machine | null> {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle()

  if (error) throw error
  return data ? toMachine(data) : null
}

export async function getMachineById(id: string): Promise<Machine | null> {
  const { data, error } = await supabase.from('machines').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? toMachine(data) : null
}
