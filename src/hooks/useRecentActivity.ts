import { useEffect, useState } from 'react'
import { getRecentLogEntries, type LogEntryWithExercise } from '../lib/services/logEntries'
import type { Exercise, LogEntry } from '../types/domain'

export interface ExerciseActivity {
  exercise: Exercise
  lastEntry: LogEntry
}

interface UseRecentActivityResult {
  activity: ExerciseActivity[]
  loading: boolean
}

export function useRecentActivity(userId: string | null): UseRecentActivityResult {
  const [activity, setActivity] = useState<ExerciseActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setActivity([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getRecentLogEntries(userId)
      .then((entries) => {
        if (cancelled) return
        setActivity(dedupeByExercise(entries))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setActivity([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { activity, loading }
}

// Regla de negocio: la actividad reciente muestra el último registro por
// ejercicio, no cada log individual — entries ya viene ordenado desc, así
// que la primera aparición de cada exercise_id es la más reciente.
function dedupeByExercise(entries: LogEntryWithExercise[]): ExerciseActivity[] {
  const seen = new Set<string>()
  const result: ExerciseActivity[] = []

  for (const { logEntry, exercise } of entries) {
    if (seen.has(exercise.id)) continue
    seen.add(exercise.id)
    result.push({ exercise, lastEntry: logEntry })
  }

  return result
}
