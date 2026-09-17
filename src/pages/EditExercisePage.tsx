import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseForm } from '../components/ExerciseForm'
import { useFooterAction } from '../components/FooterActionContext'
import { Card } from '../components/ui/Card'
import { useExercises } from '../hooks/useExercises'

const EXERCISE_FORM_ID = 'exercise-form'

export function EditExercisePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { exercises, loading, saveExercise, saving } = useExercises()
  const exercise = exercises.find((item) => item.id === id) ?? null

  useFooterAction({
    kind: 'save',
    formId: EXERCISE_FORM_ID,
    label: 'Guardar cambios',
    disabled: saving,
  })

  if (loading) {
    return <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Editar ejercicio</h1>
      <Card>
        <ExerciseForm
          formId={EXERCISE_FORM_ID}
          exercise={exercise}
          onSave={(input) => saveExercise(id, input)}
          onSuccess={() => navigate('/exercises', { viewTransition: true })}
        />
      </Card>
    </div>
  )
}
