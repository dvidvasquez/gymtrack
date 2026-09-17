/**
 * Tipos base del dominio de GymTrack.
 * Reflejan (a mano, por ahora) el esquema de las tablas en Supabase/Postgres.
 * Si el esquema crece, considerar generarlos con `supabase gen types typescript`.
 */

export interface Profile {
  id: string
  userId: string
  displayName: string
  weightKg: number | null
  heightCm: number | null
  birthDate: string | null
  createdAt: string
}

export interface Machine {
  id: string
  name: string
  qrCode: string
  muscleGroup: string | null
  createdAt: string
}

export interface LogEntry {
  id: string
  userId: string
  machineId: string
  weightKg: number
  reps: number
  sets: number
  notes: string | null
  createdAt: string
}
