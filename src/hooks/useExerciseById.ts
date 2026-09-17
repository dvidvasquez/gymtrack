import { useEffect, useState } from 'react'
import { getExerciseById } from '../lib/services/exercises'
import type { Exercise } from '../types/domain'

interface UseExerciseByIdResult {
  exercise: Exercise | null
  loading: boolean
}

export function useExerciseById(exerciseId: string): UseExerciseByIdResult {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId) {
      setExercise(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getExerciseById(exerciseId)
      .then((result) => {
        if (cancelled) return
        setExercise(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setExercise(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId])

  return { exercise, loading }
}
