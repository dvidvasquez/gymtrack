import { useCallback, useState } from 'react'
import {
  createLogEntry,
  getBestWeightKg,
  type UpdateLogEntryInput,
} from '../lib/services/logEntries'
import type { LogEntry, WeightUnit } from '../types/domain'

export interface NewLogEntryInput {
  weight: number
  unit: WeightUnit
  reps: number
  sets: number
  notes: string
}

// Resultado de guardar un registro nuevo: el registro y si fue récord
// personal (ver isWeightRecord), para que la pantalla siguiente lo festeje.
export interface SavedLogEntry {
  entry: LogEntry
  isRecord: boolean
}

// La columna `notes` no tiene límite en la base; este límite es de la app,
// para notas cortas ("me dolió el hombro", "agarre cerrado") que no rompan
// la lista de registros.
export const NOTES_MAX_LENGTH = 200

// Libra internacional, definición exacta.
const KG_PER_LB = 0.45359237

// Regla de negocio: el peso se guarda y se muestra siempre en kg; las libras
// son solo una comodidad para ingresarlo (muchas máquinas y mancuernas vienen
// marcadas en lb). Se redondea a 2 decimales, la precisión de
// `log_entries.weight_kg` (numeric(6, 2)).
export function toKg(weight: number, unit: WeightUnit): number {
  return roundTo2(unit === 'lb' ? weight * KG_PER_LB : weight)
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100
}

// Inversa de toKg, para mostrar en la unidad elegida un peso guardado en kg
// (ej. precargar el formulario con el último registro). 20.41 kg → 45 lb.
export function fromKg(weightKg: number, unit: WeightUnit): number {
  return roundTo2(unit === 'lb' ? weightKg / KG_PER_LB : weightKg)
}

// Salto del botón "+" junto al peso: el disco más chico que se suele
// agregar por lado en cada sistema.
export const WEIGHT_INCREMENT: Record<WeightUnit, number> = { kg: 2.5, lb: 5 }

export function addWeightIncrement(weight: number, unit: WeightUnit): number {
  return roundTo2(weight + WEIGHT_INCREMENT[unit])
}

// Regla de negocio: un registro nuevo arranca con los mismos valores que el
// último registro de ese ejercicio (lo más común es repetir o subir un poco),
// con el peso convertido a la unidad elegida. Sin último registro, vacío.
export function suggestedEntry(
  lastEntry: LogEntry | null,
  unit: WeightUnit,
): { weight: number; reps: number; sets: number } | null {
  if (!lastEntry) return null
  return { weight: fromKg(lastEntry.weightKg, unit), reps: lastEntry.reps, sets: lastEntry.sets }
}

// Regla de negocio: un registro es récord personal si su peso supera el
// mejor peso anterior del usuario en ese ejercicio. Igualarlo no cuenta, y
// el primer registro de un ejercicio tampoco (no hay marca que superar).
export function isWeightRecord(previousBestKg: number | null, weightKg: number): boolean {
  return previousBestKg !== null && weightKg > previousBestKg
}

// Validación y normalización compartida entre alta (createEntry) y edición
// (useExerciseHistory.updateEntry): convierte el peso a kg y limpia la nota.
export function toLogEntryValues(input: NewLogEntryInput): UpdateLogEntryInput {
  if (Number.isNaN(input.weight) || input.weight < 0) {
    throw new Error('El peso tiene que ser 0 o mayor')
  }
  if (!Number.isInteger(input.reps) || input.reps <= 0) {
    throw new Error('Las repeticiones tienen que ser un número mayor a 0')
  }
  if (!Number.isInteger(input.sets) || input.sets <= 0) {
    throw new Error('Las series tienen que ser un número mayor a 0')
  }
  const notes = input.notes.trim()
  if (notes.length > NOTES_MAX_LENGTH) {
    throw new Error(`La nota puede tener hasta ${NOTES_MAX_LENGTH} caracteres`)
  }

  return {
    weightKg: toKg(input.weight, input.unit),
    reps: input.reps,
    sets: input.sets,
    notes: notes || null,
  }
}

interface UseLogEntryResult {
  saving: boolean
  error: string | null
  createEntry: (input: NewLogEntryInput) => Promise<SavedLogEntry>
}

export function useLogEntry(exerciseId: string | null, userId: string | null): UseLogEntryResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEntry = useCallback(
    async (input: NewLogEntryInput) => {
      if (!exerciseId || !userId) throw new Error('Falta el ejercicio o el usuario')
      const values = toLogEntryValues(input)

      setSaving(true)
      setError(null)
      try {
        // La mejor marca se consulta *antes* de insertar (si no, incluiría el
        // registro nuevo). Si esa consulta falla, se guarda igual: el festejo
        // del récord no puede bloquear el registro.
        const previousBestKg = await getBestWeightKg(exerciseId, userId).catch(() => null)
        const entry = await createLogEntry({ exerciseId, userId, ...values })
        return { entry, isRecord: isWeightRecord(previousBestKg, entry.weightKg) }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo guardar el registro'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [exerciseId, userId],
  )

  return { saving, error, createEntry }
}
