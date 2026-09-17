import type { ReactNode } from 'react'
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
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useExerciseById } from '../hooks/useExerciseById'
import { useExerciseHistory } from '../hooks/useExerciseHistory'

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

function formatTooltipDate(label: ReactNode) {
  if (typeof label !== 'string') return ''
  return new Date(label).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProgressPage() {
  const { exerciseId = '' } = useParams()
  const { user } = useAuth()
  const { exercise, loading: exerciseLoading } = useExerciseById(exerciseId)
  const { history, loading: historyLoading } = useExerciseHistory(exerciseId, user?.id ?? null)

  useFooterAction(
    exercise
      ? { kind: 'add', to: `/log/exercise/${exercise.id}`, label: 'Agregar registro' }
      : null,
  )

  if (exerciseLoading) {
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

  // Se usa el createdAt completo (único por registro) como dataKey del eje
  // X en vez de una fecha ya formateada: si dos registros caen el mismo día,
  // el string formateado ("17/9") se repite y Recharts los trata como la
  // misma categoría en el eje, mostrando siempre el tooltip del primero.
  const chartData = history.map((entry) => ({
    createdAt: entry.createdAt,
    weightKg: entry.weightKg,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h1>

      <Card>
        {historyLoading ? (
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : chartData.length === 0 ? (
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Todavía no hay registros para graficar.
          </p>
        ) : (
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
                <YAxis tick={{ fontSize: 12, fill: AXIS_TEXT_COLOR }} stroke={AXIS_TEXT_COLOR} />
                <Tooltip labelFormatter={formatTooltipDate} />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  name="Peso (kg)"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
