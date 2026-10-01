import { useCallback, useEffect, useState } from 'react'
import { getExerciseById } from '../lib/services/exercises'
import type { Exercise } from '../types/domain'

interface UseExerciseByIdResult {
  exercise: Exercise | null
  loading: boolean
  // No null cuando falló la carga: distinto de `exercise === null` sin
  // error, que sí significa "no existe un ejercicio con ese id".
  error: string | null
  retry: () => void
}

const LOAD_ERROR_MESSAGE = 'No se pudo cargar el ejercicio. Revisá tu conexión y reintentá.'

export function useExerciseById(exerciseId: string): UseExerciseByIdResult {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!exerciseId) {
      setExercise(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getExerciseById(exerciseId)
      .then((result) => {
        if (cancelled) return
        setExercise(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setExercise(null)
        setError(LOAD_ERROR_MESSAGE)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId, attempt])

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  return { exercise, loading, error, retry }
}
