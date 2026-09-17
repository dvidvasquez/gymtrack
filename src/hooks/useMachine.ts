import { useEffect, useState } from 'react'
import { getMachineByQrCode } from '../lib/services/machines'
import type { Machine } from '../types/domain'

interface UseMachineResult {
  machine: Machine | null
  loading: boolean
  error: string | null
}

export function useMachine(qrCode: string): UseMachineResult {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qrCode) {
      setMachine(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getMachineByQrCode(qrCode)
      .then((result) => {
        if (cancelled) return
        setMachine(result)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudo buscar la máquina')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [qrCode])

  return { machine, loading, error }
}
