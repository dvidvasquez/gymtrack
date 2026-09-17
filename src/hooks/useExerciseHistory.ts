import { useEffect, useState } from 'react'
import { getLogEntriesForExercise } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface UseExerciseHistoryResult {
  history: LogEntry[]
  loading: boolean
}

export function useExerciseHistory(
  exerciseId: string | null,
  userId: string | null,
): UseExerciseHistoryResult {
  const [history, setHistory] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId || !userId) {
      setHistory([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getLogEntriesForExercise(exerciseId, userId)
      .then((result) => {
        if (cancelled) return
        setHistory(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setHistory([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId, userId])

  return { history, loading }
}
