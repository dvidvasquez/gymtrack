import { useEffect, useState } from 'react'
import { getLogEntriesForMachine } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface UseMachineHistoryResult {
  history: LogEntry[]
  loading: boolean
}

export function useMachineHistory(
  machineId: string | null,
  userId: string | null,
): UseMachineHistoryResult {
  const [history, setHistory] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!machineId || !userId) {
      setHistory([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getLogEntriesForMachine(machineId, userId)
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
  }, [machineId, userId])

  return { history, loading }
}
