import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useLastEntry } from '../hooks/useLastEntry'
import { useLogEntry } from '../hooks/useLogEntry'
import { useMachine } from '../hooks/useMachine'

export function LogPage() {
  const { qrCode = '' } = useParams()
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
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      await createEntry({
        weightKg: Number(weightKg),
        reps: Number(reps),
        sets: Number(sets),
      })
      setSaved(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    }
  }

  if (machineLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          Buscando máquina...
        </p>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <p className="text-base font-normal text-gray-700 dark:text-gray-300">
            No encontramos ninguna máquina con ese código QR.
          </p>
          <Link to="/scan" className="w-full">
            <Button variant="secondary">Volver a escanear</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            Registro guardado
          </h1>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            {machine.name}: {weightKg} kg × {reps} reps × {sets} series
          </p>
          <div className="w-full flex flex-col gap-2">
            <Link to="/scan" className="w-full">
              <Button>Escanear otra máquina</Button>
            </Link>
            <Link to="/home" className="w-full">
              <Button variant="secondary">Ir a Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md flex flex-col gap-6">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <p className="text-sm font-normal text-red-600">{formError ?? saveError}</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar registro'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
