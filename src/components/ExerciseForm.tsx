import { useState, type FormEvent } from 'react'
import type { ExerciseFormInput } from '../hooks/useExercises'
import type { Exercise } from '../types/domain'
import { Input } from './ui/Input'

interface ExerciseFormProps {
  formId: string
  exercise: Exercise | null
  onSave: (input: ExerciseFormInput) => Promise<Exercise>
  onSuccess?: () => void
}

// Sin botón propio a propósito, mismo patrón que ProfileForm/LogPage: quien
// use este form decide dónde vive el trigger de guardado (el footer
// dinámico de AppShell en NewExercisePage/EditExercisePage) vía `form={id}`.
export function ExerciseForm({ formId, exercise, onSave, onSuccess }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? '')
  const [qrCode, setQrCode] = useState(exercise?.qrCode ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onSave({ name, muscleGroup, qrCode })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Nombre
        </label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Avanzada con mancuernas"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="muscleGroup"
          className="text-sm font-normal text-gray-500 dark:text-gray-400"
        >
          Grupo muscular (opcional)
        </label>
        <Input
          id="muscleGroup"
          value={muscleGroup}
          onChange={(event) => setMuscleGroup(event.target.value)}
          placeholder="Ej: Piernas"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="qrCode" className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Código QR (opcional)
        </label>
        <Input
          id="qrCode"
          value={qrCode}
          onChange={(event) => setQrCode(event.target.value)}
          placeholder="Dejalo vacío si no tiene QR (ej: mancuernas, barra)"
        />
      </div>

      {error && <p className="text-sm font-normal text-amber-600">{error}</p>}
    </form>
  )
}
