import { useEffect, useState } from 'react'
import { getLastLogEntry } from '../lib/services/logEntries'
import type { LogEntry } from '../types/domain'

interface UseLastEntryResult {
  lastEntry: LogEntry | null
  loading: boolean
}

export function useLastEntry(machineId: string | null, userId: string | null): UseLastEntryResult {
  const [lastEntry, setLastEntry] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!machineId || !userId) {
      setLastEntry(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getLastLogEntry(machineId, userId).then((result) => {
      if (cancelled) return
      setLastEntry(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [machineId, userId])

  return { lastEntry, loading }
}
