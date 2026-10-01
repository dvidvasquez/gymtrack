import { useCallback, useEffect, useState } from 'react'
import {
  deleteLogEntry,
  getLogEntriesForExercise,
  updateLogEntry,
} from '../lib/services/logEntries'
import { isWeightRecord, toLogEntryValues, type NewLogEntryInput } from './useLogEntry'
import type { LogEntry, ProgressMetric } from '../types/domain'

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10
}

// Regla de negocio: qué número representa el progreso de un registro según
// la métrica elegida en el gráfico. Todas en kg.
// - weight: el peso tal cual.
// - oneRepMax: peso máximo estimado para 1 repetición (fórmula de Epley,
//   peso × (1 + reps / 30)). Con 1 rep es el peso mismo. Sirve para ver
//   progreso cuando subís reps sin subir peso.
// - volume: peso × reps × series, el trabajo total del registro.
export function metricValue(entry: LogEntry, metric: ProgressMetric): number {
  switch (metric) {
    case 'weight':
      return entry.weightKg
    case 'oneRepMax':
      return entry.reps === 1 ? entry.weightKg : roundTo1(entry.weightKg * (1 + entry.reps / 30))
    case 'volume':
      return roundTo1(entry.weightKg * entry.reps * entry.sets)
  }
}

// Ids de los registros que fueron récord personal *en su momento*: su peso
// superó a todos los anteriores (misma regla que al guardar, isWeightRecord).
// `history` viene ordenado del más viejo al más nuevo.
export function recordEntryIds(history: LogEntry[]): Set<string> {
  const records = new Set<string>()
  let bestKg: number | null = null
  for (const entry of history) {
    if (isWeightRecord(bestKg, entry.weightKg)) records.add(entry.id)
    if (bestKg === null || entry.weightKg > bestKg) bestKg = entry.weightKg
  }
  return records
}

interface UseExerciseHistoryResult {
  history: LogEntry[]
  loading: boolean
  // No null cuando falló la carga: distinto de un historial vacío.
  error: string | null
  retry: () => void
  removeEntry: (id: string) => Promise<void>
  updateEntry: (id: string, input: NewLogEntryInput) => Promise<LogEntry>
}

const LOAD_ERROR_MESSAGE = 'No se pudo cargar tu historial. Revisá tu conexión y reintentá.'

export function useExerciseHistory(
  exerciseId: string | null,
  userId: string | null,
): UseExerciseHistoryResult {
  const [history, setHistory] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!exerciseId || !userId) {
      setHistory([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getLogEntriesForExercise(exerciseId, userId)
      .then((result) => {
        if (cancelled) return
        setHistory(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setHistory([])
        setError(LOAD_ERROR_MESSAGE)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId, userId, attempt])

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  // Para corregir un registro cargado mal (ej. 800 kg en vez de 80), que si
  // no queda para siempre distorsionando el gráfico. El RLS de log_entries
  // ya limita el borrado a los registros propios.
  const removeEntry = useCallback(async (id: string) => {
    await deleteLogEntry(id)
    setHistory((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  // Edición de un registro existente (peso, reps, series, nota; la fecha no
  // cambia). Misma validación que el alta. El RLS de log_entries ya limita
  // la edición a los registros propios.
  const updateEntry = useCallback(async (id: string, input: NewLogEntryInput) => {
    const updated = await updateLogEntry(id, toLogEntryValues(input))
    setHistory((prev) => prev.map((entry) => (entry.id === id ? updated : entry)))
    return updated
  }, [])

  return { history, loading, error, retry, removeEntry, updateEntry }
}
