import { IconPencil, IconTrash } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useFooterAction } from '../components/FooterActionContext'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useExercises } from '../hooks/useExercises'
import { isOwner, useProfile } from '../hooks/useProfile'

export function ExercisesPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? null)
  const { exercises, loading, error, removeExercise } = useExercises()
  const owner = isOwner(profile)

  // Mismo patrón que ProgressPage: el botón de "+" vive en el footer de
  // AppShell, no inline en la página — para member (sin permiso de alta) cae
  // al default de AppShell (escanear).
  useFooterAction(owner ? { kind: 'add', to: '/exercises/new', label: 'Nuevo ejercicio' } : null)

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"? Esto no se puede deshacer.`)) return
    try {
      await removeExercise(id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Ejercicios</h1>

      {loading ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : error ? (
        <p className="text-sm font-normal text-amber-600">{error}</p>
      ) : exercises.length === 0 ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Todavía no hay ejercicios cargados.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="flex items-center justify-between gap-2">
              <Link
                to={`/log/exercise/${exercise.id}`}
                viewTransition
                className="flex-1 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </h2>
                  {exercise.muscleGroup && <Badge>{exercise.muscleGroup}</Badge>}
                </div>
                {!exercise.qrCode && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Sin QR — se elige a mano
                  </span>
                )}
              </Link>
              {owner && (
                <div className="flex items-center gap-1">
                  <Link
                    to={`/exercises/${exercise.id}/edit`}
                    viewTransition
                    aria-label={`Editar ${exercise.name}`}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <IconPencil size={18} stroke={2} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Eliminar ${exercise.name}`}
                    onClick={() => handleDelete(exercise.id, exercise.name)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <IconTrash size={18} stroke={2} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
