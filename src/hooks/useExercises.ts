import { useCallback, useEffect, useState } from 'react'
import {
  createExercise,
  deleteExercise,
  getAllExercises,
  updateExercise,
  type ExerciseInput,
} from '../lib/services/exercises'
import type { Exercise } from '../types/domain'

export interface ExerciseFormInput {
  name: string
  muscleGroup: string
  qrCode: string
}

interface UseExercisesResult {
  exercises: Exercise[]
  loading: boolean
  error: string | null
  saving: boolean
  saveExercise: (id: string | null, input: ExerciseFormInput) => Promise<Exercise>
  removeExercise: (id: string) => Promise<void>
}

// Códigos SQLSTATE de Postgres (vienen en `code` del error de Supabase).
// Más estable que buscar texto en `message`, que puede cambiar de redacción.
const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'

function hasErrorCode(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === code
}

function toExerciseInput(input: ExerciseFormInput): ExerciseInput {
  const name = input.name.trim()
  if (!name) throw new Error('El nombre no puede estar vacío')

  return {
    name,
    muscleGroup: input.muscleGroup.trim() || null,
    qrCode: input.qrCode.trim() || null,
  }
}

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getAllExercises()
      .then((result) => {
        if (cancelled) return
        setExercises(result)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los ejercicios')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const saveExercise = useCallback(async (id: string | null, input: ExerciseFormInput) => {
    setSaving(true)
    try {
      const details = toExerciseInput(input)
      const saved = id ? await updateExercise(id, details) : await createExercise(details)
      setExercises((prev) => {
        const withoutSaved = prev.filter((exercise) => exercise.id !== saved.id)
        return [...withoutSaved, saved].sort((a, b) => a.name.localeCompare(b.name))
      })
      return saved
    } catch (err) {
      if (hasErrorCode(err, UNIQUE_VIOLATION)) {
        throw new Error('Ya existe un ejercicio con ese código QR')
      }
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const removeExercise = useCallback(async (id: string) => {
    try {
      await deleteExercise(id)
      setExercises((prev) => prev.filter((exercise) => exercise.id !== id))
    } catch (err) {
      if (hasErrorCode(err, FOREIGN_KEY_VIOLATION)) {
        throw new Error('No se puede eliminar: tiene registros de entrenamiento asociados')
      }
      throw err
    }
  }, [])

  return { exercises, loading, error, saving, saveExercise, removeExercise }
}
