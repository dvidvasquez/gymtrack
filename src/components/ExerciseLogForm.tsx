import { useState, type FormEvent } from 'react'
import { toKg, type NewLogEntryInput } from '../hooks/useLogEntry'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import type { Exercise, LogEntry, WeightUnit } from '../types/domain'

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb']

interface ExerciseLogFormProps {
  formId: string
  exercise: Exercise
  lastEntry: LogEntry | null
  lastEntryLoading: boolean
  onSave: (input: NewLogEntryInput) => Promise<LogEntry>
  onSuccess: () => void
}

// Cuerpo compartido de "loguear una serie contra un ejercicio": nombre +
// badge + último registro + form de peso/reps/series. Lo usan LogPage (entra
// por qrCode, escaneando) y LogByExercisePage (entra por id, eligiendo de la
// lista en /exercises) — mismo criterio que ProfileForm: sin botón propio,
// conectado por `form={formId}` al footer dinámico de AppShell.
export function ExerciseLogForm({
  formId,
  exercise,
  lastEntry,
  lastEntryLoading,
  onSave,
  onSuccess,
}: ExerciseLogFormProps) {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onSave({
        weight: Number(weight),
        unit,
        reps: Number(reps),
        sets: Number(sets),
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    }
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h1>
        {exercise.muscleGroup && <Badge>{exercise.muscleGroup}</Badge>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Último registro
        </span>
        {lastEntryLoading ? (
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : lastEntry ? (
          <p className="text-base font-normal text-gray-700 dark:text-gray-300">
            {lastEntry.weightKg} kg × {lastEntry.reps} reps × {lastEntry.sets} series
          </p>
        ) : (
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Todavía no tenés registros en este ejercicio.
          </p>
        )}
      </div>

      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Unidad del peso
          </span>
          <div
            role="radiogroup"
            aria-label="Unidad del peso"
            className="flex rounded-lg border border-gray-200 dark:border-gray-800 p-0.5"
          >
            {WEIGHT_UNITS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={unit === option}
                onClick={() => setUnit(option)}
                className={`h-8 min-w-12 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
                  unit === option
                    ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="weight" className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Peso ({unit})
            </label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.25"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="reps" className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Reps
            </label>
            <Input
              id="reps"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sets" className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Series
            </label>
            <Input
              id="sets"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={sets}
              onChange={(event) => setSets(event.target.value)}
              required
            />
          </div>
        </div>
        {unit === 'lb' && weight !== '' && Number(weight) >= 0 && (
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Se guarda como {toKg(Number(weight), 'lb')} kg
          </p>
        )}
        {error && <p className="text-sm font-normal text-amber-600">{error}</p>}
      </form>
    </Card>
  )
}
