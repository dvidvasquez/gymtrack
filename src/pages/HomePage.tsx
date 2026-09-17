import { IconCircleCheck } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MachineCard } from '../components/MachineCard'
import { useAuth } from '../hooks/useAuth'
import { useRecentActivity } from '../hooks/useRecentActivity'

interface LogSavedState {
  justSaved?: boolean
}

const SUCCESS_MESSAGE_TIMEOUT_MS = 4000

export function HomePage() {
  const { user } = useAuth()
  const { activity, loading } = useRecentActivity(user?.id ?? null)
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
      ) : activity.length === 0 ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Todavía no registraste ningún entrenamiento.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {activity.map(({ machine, lastEntry }) => (
            <MachineCard key={machine.id} machine={machine} lastEntry={lastEntry} />
          ))}
        </div>
      )}
    </div>
  )
}
