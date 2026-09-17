import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseLogForm } from '../components/ExerciseLogForm'
import { useFooterAction } from '../components/FooterActionContext'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useExerciseById } from '../hooks/useExerciseById'
import { useLastEntry } from '../hooks/useLastEntry'
import { useLogEntry } from '../hooks/useLogEntry'

const LOG_FORM_ID = 'log-form'

// Segundo entry point al mismo flujo de registro que LogPage (ver
// components/ExerciseLogForm), para cuando el ejercicio se elige a mano
// desde /exercises en vez de escanear un QR — típicamente mancuernas o
// barra, que no tienen un lugar fijo donde pegar un código.
export function LogByExercisePage() {
  const { exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { exercise, loading: exerciseLoading } = useExerciseById(exerciseId)
  const { lastEntry, loading: lastEntryLoading } = useLastEntry(
    exercise?.id ?? null,
    user?.id ?? null,
  )
  const { createEntry, saving } = useLogEntry(exercise?.id ?? null, user?.id ?? null)

  useFooterAction(
    exercise ? { kind: 'save', formId: LOG_FORM_ID, label: 'Guardar registro', disabled: saving } : null,
  )

  if (exerciseLoading) {
    return (
      <p className="text-base font-normal text-gray-500 dark:text-gray-400">
        Buscando ejercicio...
      </p>
    )
  }

  if (!exercise) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="text-base font-normal text-gray-700 dark:text-gray-300">
          No encontramos ese ejercicio.
        </p>
      </Card>
    )
  }

  return (
    <ExerciseLogForm
      formId={LOG_FORM_ID}
      exercise={exercise}
      lastEntry={lastEntry}
      lastEntryLoading={lastEntryLoading}
      onSave={createEntry}
      onSuccess={() => navigate('/home', { viewTransition: true, state: { justSaved: true } })}
    />
  )
}
