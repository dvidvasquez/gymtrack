import { IconPlus } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import {
  addWeightIncrement,
  NOTES_MAX_LENGTH,
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

interface LastEntryState {
  entry: LogEntry | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

interface ExerciseLogFormProps<T> {
  formId: string
  exercise: Exercise
  // Alta: el último registro (se muestra y precarga los campos). Edición:
  // `editingEntry`, el registro que se modifica (precarga todo, nota
  // incluida, y reemplaza la sección "Último registro"). Va uno de los dos.
  lastEntry?: LastEntryState
  editingEntry?: LogEntry
  onSave: (input: NewLogEntryInput) => Promise<T>
  onSuccess: (result: T) => void
}

function formatEntryDate(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Cuerpo compartido de "loguear una serie contra un ejercicio": nombre +
// badge + último registro + form de peso/reps/series/nota. Lo usan LogPage
// (entra por qrCode, escaneando), LogByExercisePage (entra por id, eligiendo
// de la lista en /exercises) y EditLogEntryPage (edita un registro existente)
// — mismo criterio que ProfileForm: sin botón propio, conectado por
// `form={formId}` al footer dinámico de AppShell.
export function ExerciseLogForm<T>({
  formId,
  exercise,
  lastEntry,
  editingEntry,
  onSave,
  onSuccess,
}: ExerciseLogFormProps<T>) {
  const [unit, setUnit] = useWeightUnit()
  // `null` = el usuario todavía no tocó el campo: se muestra el valor sugerido
  // (el del último registro, ver suggestedEntry). Así la sugerencia aparece
  // aunque el último registro termine de cargar después del primer render, y
  // el peso sugerido sigue a la unidad elegida mientras no se edite.
  const [weight, setWeight] = useState<string | null>(null)
  const [reps, setReps] = useState<string | null>(null)
  const [sets, setSets] = useState<string | null>(null)
  // La nota no se sugiere desde el último registro (es de cada sesión); en
  // edición arranca con la nota que ya tenía.
  const [notes, setNotes] = useState(editingEntry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const suggestion = suggestedEntry(editingEntry ?? lastEntry?.entry ?? null, unit)
  const weightValue = weight ?? (suggestion ? String(suggestion.weight) : '')
  const repsValue = reps ?? (suggestion ? String(suggestion.reps) : '')
  const setsValue = sets ?? (suggestion ? String(suggestion.sets) : '')
  const showsSuggestion =
    !editingEntry && suggestion !== null && (weight === null || reps === null || sets === null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const result = await onSave({
        weight: Number(weightValue),
        unit,
        reps: Number(repsValue),
        sets: Number(setsValue),
        notes,
      })
      onSuccess(result)
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

      {editingEntry ? (
        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Editando el registro del {formatEntryDate(editingEntry.createdAt)}
        </p>
      ) : lastEntry ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Último registro
          </span>
          {lastEntry.loading ? (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
          ) : lastEntry.error ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-normal text-amber-600">{lastEntry.error}</p>
              <button
                type="button"
                onClick={lastEntry.onRetry}
                className="shrink-0 text-sm font-medium text-red-600 dark:text-red-400 underline"
              >
                Reintentar
              </button>
            </div>
          ) : lastEntry.entry ? (
            <>
              <p className="text-base font-normal text-gray-700 dark:text-gray-300">
                {lastEntry.entry.weightKg} kg × {lastEntry.entry.reps} reps ×{' '}
                {lastEntry.entry.sets} series
              </p>
              {lastEntry.entry.notes && (
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  “{lastEntry.entry.notes}”
                </p>
              )}
            </>
          ) : (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">
              Todavía no tenés registros en este ejercicio.
            </p>
          )}
        </div>
      ) : null}

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
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="notes" className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Nota (opcional)
            </label>
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              {notes.length}/{NOTES_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="notes"
            rows={2}
            maxLength={NOTES_MAX_LENGTH}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej: agarre cerrado, me molestó el hombro"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          />
        </div>
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
