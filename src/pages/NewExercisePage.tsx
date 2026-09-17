import { useNavigate } from 'react-router-dom'
import { ExerciseForm } from '../components/ExerciseForm'
import { useFooterAction } from '../components/FooterActionContext'
import { Card } from '../components/ui/Card'
import { useExercises } from '../hooks/useExercises'

const EXERCISE_FORM_ID = 'exercise-form'

export function NewExercisePage() {
  const navigate = useNavigate()
  const { saveExercise, saving } = useExercises()

  useFooterAction({
    kind: 'save',
    formId: EXERCISE_FORM_ID,
    label: 'Crear ejercicio',
    disabled: saving,
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Nuevo ejercicio</h1>
      <Card>
        <ExerciseForm
          formId={EXERCISE_FORM_ID}
          exercise={null}
          onSave={(input) => saveExercise(null, input)}
          onSuccess={() => navigate('/exercises', { viewTransition: true })}
        />
      </Card>
    </div>
  )
}
