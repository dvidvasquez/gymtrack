import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseLogForm } from '../components/ExerciseLogForm'
import { useFooterAction } from '../components/FooterActionContext'
import { LoadErrorCard } from '../components/LoadErrorCard'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useExerciseById } from '../hooks/useExerciseById'
import { useExerciseHistory } from '../hooks/useExerciseHistory'

const LOG_FORM_ID = 'edit-log-form'

// Edición de un registro existente, a la que se llega desde la lista de
// registros de ProgressPage. Mismo patrón que EditExercisePage: busca el
// registro dentro del historial que ya carga useExerciseHistory (en vez de
// un fetch aparte por id) y reutiliza el formulario de alta.
export function EditLogEntryPage() {
  const { exerciseId = '', entryId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    exercise,
    loading: exerciseLoading,
    error: exerciseError,
    retry: retryExercise,
  } = useExerciseById(exerciseId)
  const {
    history,
    loading: historyLoading,
    error: historyError,
    retry: retryHistory,
    updateEntry,
  } = useExerciseHistory(exerciseId, user?.id ?? null)
  const [saving, setSaving] = useState(false)
  const entry = history.find((item) => item.id === entryId) ?? null

  useFooterAction(
    exercise && entry
      ? { kind: 'save', formId: LOG_FORM_ID, label: 'Guardar cambios', disabled: saving }
      : null,
  )

  if (exerciseLoading || historyLoading) {
    return <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  if (exerciseError) return <LoadErrorCard message={exerciseError} onRetry={retryExercise} />
  if (historyError) return <LoadErrorCard message={historyError} onRetry={retryHistory} />

  if (!exercise || !entry) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="text-base font-normal text-gray-700 dark:text-gray-300">
          No encontramos ese registro.
        </p>
      </Card>
    )
  }

  return (
    <ExerciseLogForm
      formId={LOG_FORM_ID}
      exercise={exercise}
      editingEntry={entry}
      onSave={async (input) => {
        setSaving(true)
        try {
          return await updateEntry(entry.id, input)
        } finally {
          setSaving(false)
        }
      }}
      onSuccess={() => navigate(`/progress/${exercise.id}`, { viewTransition: true })}
    />
  )
}
