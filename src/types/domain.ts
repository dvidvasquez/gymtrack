/**
 * Tipos base del dominio de GymTrack.
 * Reflejan (a mano, por ahora) el esquema de las tablas en Supabase/Postgres.
 * Si el esquema crece, considerar generarlos con `supabase gen types typescript`.
 */

export type ProfileRole = 'owner' | 'member'

export interface Profile {
  id: string
  userId: string
  displayName: string
  weightKg: number | null
  heightCm: number | null
  birthDate: string | null
  role: ProfileRole
  createdAt: string
}

// qrCode es null para ejercicios sin equipamiento fijo (mancuernas, barra)
// que no tienen un lugar donde pegar un QR físico y se eligen a mano desde
// /exercises en vez de escanear. Cuando no es null, es el valor que codifica
// el QR impreso (ver scripts/generate-qr-codes.mjs).
export interface Exercise {
  id: string
  name: string
  qrCode: string | null
  muscleGroup: string | null
  createdAt: string
}

export interface LogEntry {
  id: string
  userId: string
  exerciseId: string
  weightKg: number
  reps: number
  sets: number
  notes: string | null
  createdAt: string
}
