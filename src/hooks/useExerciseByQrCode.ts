import { useCallback, useEffect, useState } from 'react'
import { getExerciseByQrCode } from '../lib/services/exercises'
import type { Exercise } from '../types/domain'

interface UseExerciseByQrCodeResult {
  exercise: Exercise | null
  loading: boolean
  // No null cuando falló la carga: distinto de `exercise === null` sin
  // error, que sí significa "ningún ejercicio tiene ese QR".
  error: string | null
  retry: () => void
}

const LOAD_ERROR_MESSAGE = 'No se pudo buscar el ejercicio. Revisá tu conexión y reintentá.'

export function useExerciseByQrCode(qrCode: string): UseExerciseByQrCodeResult {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!qrCode) {
      setExercise(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getExerciseByQrCode(qrCode)
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
  }, [qrCode, attempt])

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  return { exercise, loading, error, retry }
}
