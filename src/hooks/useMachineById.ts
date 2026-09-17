import { useEffect, useState } from 'react'
import { getMachineById } from '../lib/services/machines'
import type { Machine } from '../types/domain'

interface UseMachineByIdResult {
  machine: Machine | null
  loading: boolean
}

export function useMachineById(machineId: string): UseMachineByIdResult {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!machineId) {
      setMachine(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getMachineById(machineId)
      .then((result) => {
        if (cancelled) return
        setMachine(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setMachine(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [machineId])

  return { machine, loading }
}
