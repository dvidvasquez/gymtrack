import { IconPlus } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import {
  addWeightIncrement,
  suggestedEntry,
  toKg,
  WEIGHT_INCREMENT,
  type NewLogEntryInput,
} from '../hooks/useLogEntry'
import { useWeightUnit } from '../hooks/useWeightUnit'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { SegmentedControl } from './ui/SegmentedControl'
import type { Exercise, LogEntry, WeightUnit } from '../types/domain'

const WEIGHT_UNIT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
]

interface ExerciseLogFormProps {
  formId: string
  exercise: Exercise
  lastEntry: LogEntry | null
  lastEntryLoading: boolean
  lastEntryError: string | null
  onRetryLastEntry: () => void
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
  lastEntryError,
  onRetryLastEntry,
  onSave,
  onSuccess,
}: ExerciseLogFormProps) {
  const [unit, setUnit] = useWeightUnit()
  // `null` = el usuario todavía no tocó el campo: se muestra el valor sugerido
  // (el del último registro, ver suggestedEntry). Así la sugerencia aparece
  // aunque el último registro termine de cargar después del primer render, y
  // el peso sugerido sigue a la unidad elegida mientras no se edite.
  const [weight, setWeight] = useState<string | null>(null)
  const [reps, setReps] = useState<string | null>(null)
  const [sets, setSets] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const suggestion = suggestedEntry(lastEntry, unit)
  const weightValue = weight ?? (suggestion ? String(suggestion.weight) : '')
  const repsValue = reps ?? (suggestion ? String(suggestion.reps) : '')
  const setsValue = sets ?? (suggestion ? String(suggestion.sets) : '')
  const showsSuggestion = suggestion !== null && (weight === null || reps === null || sets === null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onSave({
        weight: Number(weightValue),
        unit,
        reps: Number(repsValue),
        sets: Number(setsValue),
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
        ) : lastEntryError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-normal text-amber-600">{lastEntryError}</p>
            <button
              type="button"
              onClick={onRetryLastEntry}
              className="shrink-0 text-sm font-medium text-red-600 dark:text-red-400 underline"
            >
              Reintentar
            </button>
          </div>
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
          <SegmentedControl
            label="Unidad del peso"
            options={WEIGHT_UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
          />
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
              value={weightValue}
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
              value={repsValue}
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
              value={setsValue}
              onChange={(event) => setSets(event.target.value)}
              required
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWeight(String(addWeightIncrement(Number(weightValue) || 0, unit)))}
          className="w-fit h-9 px-3 flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
        >
          <IconPlus size={16} stroke={2} />
          {WEIGHT_INCREMENT[unit]} {unit}
        </button>
        {showsSuggestion && (
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Precargado con tu último registro.
          </p>
        )}
        {unit === 'lb' && weightValue !== '' && Number(weightValue) >= 0 && (
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Se guarda como {toKg(Number(weightValue), 'lb')} kg
          </p>
        )}
        {error && <p className="text-sm font-normal text-amber-600">{error}</p>}
      </form>
    </Card>
  )
}
