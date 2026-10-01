import { useCallback, useEffect, useState } from 'react'
import { getRecentLogEntries, type LogEntryWithExercise } from '../lib/services/logEntries'
import type { Exercise, LogEntry } from '../types/domain'

export interface ExerciseActivity {
  exercise: Exercise
  lastEntry: LogEntry
}

// Actividad de un mismo día (según la hora local del dispositivo, no UTC:
// un registro de las 22hs en Argentina es de "hoy", aunque en UTC ya sea
// mañana). `day` es la clave `YYYY-MM-DD` de ese día.
export interface ActivityDay {
  day: string
  activity: ExerciseActivity[]
}

interface UseRecentActivityResult {
  days: ActivityDay[]
  loading: boolean
  // No null cuando falló la carga: distinto de `days` vacío sin error, que
  // sí significa "todavía no registraste nada".
  error: string | null
  retry: () => void
}

export function toLocalDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Cuántos registros trae Home. Alcanza para varios días de entrenamiento
// aun cargando cada serie por separado; es un solo fetch chico.
const RECENT_ENTRIES_LIMIT = 200

const LOAD_ERROR_MESSAGE = 'No se pudo cargar tu actividad. Revisá tu conexión y reintentá.'

export function useRecentActivity(userId: string | null): UseRecentActivityResult {
  const [days, setDays] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) {
      setDays([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getRecentLogEntries(userId, RECENT_ENTRIES_LIMIT)
      .then((entries) => {
        if (cancelled) return
        setDays(groupByDay(entries, entries.length === RECENT_ENTRIES_LIMIT))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDays([])
        setError(LOAD_ERROR_MESSAGE)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  return { days, loading, error, retry }
}

// Regla de negocio: cada día muestra cada ejercicio que se hizo ese día una
// sola vez, con su último registro *de ese día*. La deduplicación es por
// (día, ejercicio), no global: si la extensión de tríceps se hizo el martes
// y otra vez ayer, aparece en los dos días.
//
// `entries` viene ordenado del más nuevo al más viejo, así que los registros
// de un mismo día son consecutivos y la primera aparición de un ejercicio
// dentro de un día es la más reciente.
//
// Si el fetch llegó al límite (`truncated`), el día más viejo puede estar
// cortado (algunos de sus registros quedaron afuera): se descarta en vez de
// mostrarlo incompleto, salvo que sea el único día.
function groupByDay(entries: LogEntryWithExercise[], truncated: boolean): ActivityDay[] {
  const days: ActivityDay[] = []
  let seenToday = new Set<string>()

  for (const { logEntry, exercise } of entries) {
    const day = toLocalDayKey(new Date(logEntry.createdAt))
    let current = days.at(-1)
    if (current?.day !== day) {
      current = { day, activity: [] }
      days.push(current)
      seenToday = new Set()
    }
    if (seenToday.has(exercise.id)) continue
    seenToday.add(exercise.id)
    current.activity.push({ exercise, lastEntry: logEntry })
  }

  if (truncated && days.length > 1) days.pop()
  return days
}
