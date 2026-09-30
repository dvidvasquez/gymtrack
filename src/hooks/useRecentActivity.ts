import { useEffect, useState } from 'react'
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
}

export function toLocalDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useRecentActivity(userId: string | null): UseRecentActivityResult {
  const [activity, setActivity] = useState<ExerciseActivity[]>([])
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
        setActivity(dedupeByExercise(entries))
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

  return { days: groupByDay(activity), loading }
}

// La actividad ya viene ordenada de la más reciente a la más vieja, así que
// los registros de un mismo día quedan consecutivos y alcanza con cortar
// cada vez que cambia el día.
function groupByDay(activity: ExerciseActivity[]): ActivityDay[] {
  const days: ActivityDay[] = []

  for (const item of activity) {
    const day = toLocalDayKey(new Date(item.lastEntry.createdAt))
    const current = days.at(-1)
    if (current?.day === day) {
      current.activity.push(item)
    } else {
      days.push({ day, activity: [item] })
    }
  }

  return days
}

// Regla de negocio: la actividad reciente muestra el último registro por
// ejercicio, no cada log individual — entries ya viene ordenado desc, así
// que la primera aparición de cada exercise_id es la más reciente.
function dedupeByExercise(entries: LogEntryWithExercise[]): ExerciseActivity[] {
  const seen = new Set<string>()
  const result: ExerciseActivity[] = []

  for (const { logEntry, exercise } of entries) {
    if (seen.has(exercise.id)) continue
    seen.add(exercise.id)
    result.push({ exercise, lastEntry: logEntry })
  }

  return result
}
