import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFooterAction } from '../components/FooterActionContext'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useLastEntry } from '../hooks/useLastEntry'
import { useLogEntry } from '../hooks/useLogEntry'
import { useMachine } from '../hooks/useMachine'

const LOG_FORM_ID = 'log-form'

export function LogPage() {
  const { qrCode = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { machine, loading: machineLoading } = useMachine(qrCode)
  const { lastEntry, loading: lastEntryLoading } = useLastEntry(
    machine?.id ?? null,
    user?.id ?? null,
  )
  const { createEntry, saving, error: saveError } = useLogEntry(
    machine?.id ?? null,
    user?.id ?? null,
  )

  const [weightKg, setWeightKg] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // El botón de guardar vive en el footer de AppShell (ver AppShell /
  // FooterActionContext), no acá — así la página tiene un solo botón.
  useFooterAction(
    machine ? { kind: 'save', formId: LOG_FORM_ID, label: 'Guardar registro', disabled: saving } : null,
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!machine) return
    setFormError(null)
    try {
      await createEntry({
        weightKg: Number(weightKg),
        reps: Number(reps),
        sets: Number(sets),
      })
      navigate('/home', {
        viewTransition: true,
        state: { justSaved: true },
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    }
  }

  if (machineLoading) {
    return (
      <p className="text-base font-normal text-gray-500 dark:text-gray-400">Buscando máquina...</p>
    )
  }

  if (!machine) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="text-base font-normal text-gray-700 dark:text-gray-300">
          No encontramos ninguna máquina con ese código QR.
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{machine.name}</h1>
        {machine.muscleGroup && <Badge>{machine.muscleGroup}</Badge>}
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
            Todavía no tenés registros en esta máquina.
          </p>
        )}
      </div>

      <form id={LOG_FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="weightKg"
              className="text-sm font-normal text-gray-500 dark:text-gray-400"
            >
              Peso (kg)
            </label>
            <Input
              id="weightKg"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
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
        {(formError ?? saveError) && (
          <p className="text-sm font-normal text-amber-600">{formError ?? saveError}</p>
        )}
      </form>
    </Card>
  )
}
