import { useEffect, useState } from 'react'
import { getExerciseByQrCode } from '../lib/services/exercises'
import type { Exercise } from '../types/domain'

interface UseExerciseByQrCodeResult {
  exercise: Exercise | null
  loading: boolean
  error: string | null
}

export function useExerciseByQrCode(qrCode: string): UseExerciseByQrCodeResult {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudo buscar el ejercicio')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [qrCode])

  return { exercise, loading, error }
}
