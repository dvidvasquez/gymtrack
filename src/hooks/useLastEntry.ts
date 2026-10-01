import { useCallback, useEffect, useState } from 'react'
import { getLastLogEntry } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface UseLastEntryResult {
  lastEntry: LogEntry | null
  loading: boolean
  // No null cuando falló la carga: distinto de `lastEntry === null` sin
  // error, que sí significa "nunca registraste este ejercicio".
  error: string | null
  retry: () => void
}

const LOAD_ERROR_MESSAGE = 'No se pudo cargar tu último registro.'

export function useLastEntry(exerciseId: string | null, userId: string | null): UseLastEntryResult {
  const [lastEntry, setLastEntry] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!exerciseId || !userId) {
      setLastEntry(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getLastLogEntry(exerciseId, userId)
      .then((result) => {
        if (cancelled) return
        setLastEntry(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLastEntry(null)
        setError(LOAD_ERROR_MESSAGE)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId, userId, attempt])

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  return { lastEntry, loading, error, retry }
}
