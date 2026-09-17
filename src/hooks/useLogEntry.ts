import { useCallback, useState } from 'react'
import { createLogEntry } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface NewLogEntryInput {
  weightKg: number
  reps: number
  sets: number
}

interface UseLogEntryResult {
  saving: boolean
  error: string | null
  createEntry: (input: NewLogEntryInput) => Promise<LogEntry>
}

export function useLogEntry(machineId: string | null, userId: string | null): UseLogEntryResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEntry = useCallback(
    async (input: NewLogEntryInput) => {
      if (!machineId || !userId) throw new Error('Falta la máquina o el usuario')

      if (Number.isNaN(input.weightKg) || input.weightKg < 0) {
        throw new Error('El peso tiene que ser 0 o mayor')
      }
      if (!Number.isInteger(input.reps) || input.reps <= 0) {
        throw new Error('Las repeticiones tienen que ser un número mayor a 0')
      }
      if (!Number.isInteger(input.sets) || input.sets <= 0) {
        throw new Error('Las series tienen que ser un número mayor a 0')
      }

      setSaving(true)
      setError(null)
      try {
        return await createLogEntry({
          machineId,
          userId,
          weightKg: input.weightKg,
          reps: input.reps,
          sets: input.sets,
          notes: null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo guardar el registro'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [machineId, userId],
  )

  return { saving, error, createEntry }
}
