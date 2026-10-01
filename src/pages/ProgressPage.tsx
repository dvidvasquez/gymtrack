import { IconTrash } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFooterAction } from '../components/FooterActionContext'
import { LoadErrorCard } from '../components/LoadErrorCard'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useAuth } from '../hooks/useAuth'
import { useExerciseById } from '../hooks/useExerciseById'
import { metricValue, useExerciseHistory } from '../hooks/useExerciseHistory'
import type { ProgressMetric } from '../types/domain'

const METRIC_OPTIONS: { value: ProgressMetric; label: string }[] = [
  { value: 'weight', label: 'Peso' },
  { value: 'oneRepMax', label: '1RM' },
  { value: 'volume', label: 'Volumen' },
]

// Nombre en el tooltip y explicación debajo del selector, por métrica.
const METRIC_DETAILS: Record<ProgressMetric, { name: string; description: string }> = {
  weight: { name: 'Peso', description: 'El peso de cada registro.' },
  oneRepMax: {
    name: '1RM estimado',
    description:
      'Peso máximo estimado para 1 repetición (fórmula de Epley). Sube aunque solo subas reps.',
  },
  volume: { name: 'Volumen', description: 'Peso × reps × series: el trabajo total del registro.' },
}

// Gris fijo (Tailwind gray-500) en vez de `stroke="currentColor"` + clase
// `dark:` de Tailwind: ese approach no se estaba heredando de forma
// confiable a los <text> que Recharts genera para los ticks (quedaban
// negros en modo oscuro). #6b7280 tiene contraste aceptable tanto sobre
// la card blanca como sobre la card oscura, sin depender de esa herencia.
const AXIS_TEXT_COLOR = '#6b7280'

// red-600 (color de acento de la app, ver DESIGN.md) en hex: Recharts no
// resuelve clases de Tailwind en `stroke`, necesita el valor literal.
const LINE_COLOR = '#dc2626'

function formatAxisDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function formatEntryDate(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTooltipDate(label: ReactNode) {
  if (typeof label !== 'string') return ''
  return formatEntryDate(label)
}

export function ProgressPage() {
  const { exerciseId = '' } = useParams()
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
    removeEntry,
  } = useExerciseHistory(exerciseId, user?.id ?? null)
  const [metric, setMetric] = useState<ProgressMetric>('weight')

  useFooterAction(
    exercise
      ? { kind: 'add', to: `/log/exercise/${exercise.id}`, label: 'Agregar registro' }
      : null,
  )

  if (exerciseLoading) {
    return <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  if (exerciseError) return <LoadErrorCard message={exerciseError} onRetry={retryExercise} />

  if (!exercise) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="text-base font-normal text-gray-700 dark:text-gray-300">
          No encontramos ese ejercicio.
        </p>
      </Card>
    )
  }

  async function handleDelete(id: string, description: string) {
    if (!window.confirm(`¿Eliminar el registro ${description}? Esto no se puede deshacer.`)) return
    try {
      await removeEntry(id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
    }
  }

  // Se usa el createdAt completo (único por registro) como dataKey del eje
  // X en vez de una fecha ya formateada: si dos registros caen el mismo día,
  // el string formateado ("17/9") se repite y Recharts los trata como la
  // misma categoría en el eje, mostrando siempre el tooltip del primero.
  const chartData = history.map((entry) => ({
    createdAt: entry.createdAt,
    value: metricValue(entry, metric),
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h1>

      {historyError ? (
        <LoadErrorCard message={historyError} onRetry={retryHistory} />
      ) : (
        <Card className="flex flex-col gap-4">
          {historyLoading ? (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
          ) : chartData.length === 0 ? (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">
              Todavía no hay registros para graficar.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <SegmentedControl
                  label="Qué graficar"
                  options={METRIC_OPTIONS}
                  value={metric}
                  onChange={setMetric}
                />
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {METRIC_DETAILS[metric].description}
                </p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-800"
                    />
                    <XAxis
                      dataKey="createdAt"
                      tickFormatter={formatAxisDate}
                      tick={{ fontSize: 12, fill: AXIS_TEXT_COLOR }}
                      stroke={AXIS_TEXT_COLOR}
                    />
                    {/* Eje ajustado al rango de los datos, no desde 0: si no, una mejora
                        de 106.7 a 107.7 kg se ve como una línea plana. */}
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: AXIS_TEXT_COLOR }}
                      stroke={AXIS_TEXT_COLOR}
                    />
                    <Tooltip
                      labelFormatter={formatTooltipDate}
                      formatter={(value) => `${value} kg`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={METRIC_DETAILS[metric].name}
                      stroke={LINE_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Registros</h2>
          <Card className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800 py-2">
            {[...history].reverse().map((entry) => {
              const date = formatEntryDate(entry.createdAt)
              const summary = `${entry.weightKg} kg × ${entry.reps} reps × ${entry.sets} series`
              return (
                <div key={entry.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex flex-col">
                    <span className="text-base font-normal text-gray-700 dark:text-gray-300">
                      {summary}
                    </span>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {date}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Eliminar registro del ${date}`}
                    onClick={() => handleDelete(entry.id, `del ${date} (${summary})`)}
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <IconTrash size={18} stroke={2} />
                  </button>
                </div>
              )
            })}
          </Card>
        </div>
      )}
    </div>
  )
}
