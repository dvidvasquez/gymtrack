import { useCallback, useEffect, useState } from 'react'
import { deleteLogEntry, getLogEntriesForExercise } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface UseExerciseHistoryResult {
  history: LogEntry[]
  loading: boolean
  removeEntry: (id: string) => Promise<void>
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

  // Para corregir un registro cargado mal (ej. 800 kg en vez de 80), que si
  // no queda para siempre distorsionando el gráfico. El RLS de log_entries
  // ya limita el borrado a los registros propios.
  const removeEntry = useCallback(async (id: string) => {
    await deleteLogEntry(id)
    setHistory((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  return { history, loading, removeEntry }
}
