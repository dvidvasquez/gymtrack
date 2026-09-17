import { useEffect, useState } from 'react'
import { getRecentLogEntries, type LogEntryWithMachine } from '../lib/services/logEntries'
import type { LogEntry, Machine } from '../types/domain'

export interface MachineActivity {
  machine: Machine
  lastEntry: LogEntry
}

interface UseRecentActivityResult {
  activity: MachineActivity[]
  loading: boolean
}

export function useRecentActivity(userId: string | null): UseRecentActivityResult {
  const [activity, setActivity] = useState<MachineActivity[]>([])
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
        setActivity(dedupeByMachine(entries))
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
// máquina, no cada log individual — entries ya viene ordenado desc, así
// que la primera aparición de cada machine_id es la más reciente.
function dedupeByMachine(entries: LogEntryWithMachine[]): MachineActivity[] {
  const seen = new Set<string>()
  const result: MachineActivity[] = []

  for (const { logEntry, machine } of entries) {
    if (seen.has(machine.id)) continue
    seen.add(machine.id)
    result.push({ machine, lastEntry: logEntry })
  }

  return result
}
