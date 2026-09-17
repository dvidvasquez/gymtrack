import { IconPencil, IconSearch, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFooterAction } from '../components/FooterActionContext'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useExercises } from '../hooks/useExercises'
import { isOwner, useProfile } from '../hooks/useProfile'
import type { Exercise } from '../types/domain'

function matchesSearch(exercise: Exercise, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    exercise.name.toLowerCase().includes(normalized) ||
    (exercise.muscleGroup?.toLowerCase().includes(normalized) ?? false)
  )
}

export function ExercisesPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? null)
  const { exercises, loading, error, removeExercise } = useExercises()
  const owner = isOwner(profile)
  const [search, setSearch] = useState('')

  // Mismo patrón que ProgressPage: el botón de "+" vive en el footer de
  // AppShell, no inline en la página — para member (sin permiso de alta) cae
  // al default de AppShell (escanear).
  useFooterAction(owner ? { kind: 'add', to: '/exercises/new', label: 'Nuevo ejercicio' } : null)

  const filteredExercises = exercises.filter((exercise) => matchesSearch(exercise, search))

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

      <div className="relative">
        <IconSearch
          size={18}
          stroke={2}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar ejercicio..."
          aria-label="Buscar ejercicio"
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : error ? (
        <p className="text-sm font-normal text-amber-600">{error}</p>
      ) : exercises.length === 0 ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Todavía no hay ejercicios cargados.
        </p>
      ) : filteredExercises.length === 0 ? (
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Ningún ejercicio coincide con "{search.trim()}".
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredExercises.map((exercise) => (
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
