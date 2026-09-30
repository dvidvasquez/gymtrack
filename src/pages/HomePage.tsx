import { IconCircleCheck } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ExerciseCard } from '../components/ExerciseCard'
import { useAuth } from '../hooks/useAuth'
import { toLocalDayKey, useRecentActivity } from '../hooks/useRecentActivity'

interface LogSavedState {
  justSaved?: boolean
}

const SUCCESS_MESSAGE_TIMEOUT_MS = 4000

// "Hoy", "Ayer", o el día con nombre ("Lunes, 22 de septiembre"); el año
// solo aparece si no es el actual.
function formatDayLabel(day: string): string {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (day === toLocalDayKey(today)) return 'Hoy'
  if (day === toLocalDayKey(yesterday)) return 'Ayer'

  const [year, month, date] = day.split('-').map(Number)
  const label = new Date(year, month - 1, date).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(year !== today.getFullYear() && { year: 'numeric' }),
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function HomePage() {
  const { user } = useAuth()
  const { days, loading } = useRecentActivity(user?.id ?? null)
  const location = useLocation()
  const navigate = useNavigate()

  const [showSuccess, setShowSuccess] = useState<boolean>(
    () => (location.state as LogSavedState | null)?.justSaved ?? false,
  )

  useEffect(() => {
    if (!showSuccess) return

    // Limpia el state de la navegación para que el mensaje no reaparezca
    // si el usuario vuelve a esta entrada del historial con back/forward.
    navigate('.', { replace: true, state: null })

    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_TIMEOUT_MS)
    return () => clearTimeout(timeout)
    // Solo debe correr una vez, al montar con un mensaje pendiente — no en
    // cada cambio de showSuccess (lo limpiaríamos apenas lo seteamos).
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-3 py-2 text-sm font-normal text-green-700 dark:text-green-400">
          <IconCircleCheck size={18} stroke={2} />
          Registro guardado
        </div>
      )}

      <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">Actividad reciente</h1>
      {loading ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : days.length === 0 ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Todavía no registraste ningún entrenamiento.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map(({ day, activity }) => (
            <section key={day} className="flex flex-col gap-2">
              <h2 className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {formatDayLabel(day)}
              </h2>
              <div className="flex flex-col gap-3">
                {activity.map(({ exercise, lastEntry }) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} lastEntry={lastEntry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
