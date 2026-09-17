import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useMachineById } from '../hooks/useMachineById'
import { useMachineHistory } from '../hooks/useMachineHistory'

// Gris fijo (Tailwind gray-500) en vez de `stroke="currentColor"` + clase
// `dark:` de Tailwind: ese approach no se estaba heredando de forma
// confiable a los <text> que Recharts genera para los ticks (quedaban
// negros en modo oscuro). #6b7280 tiene contraste aceptable tanto sobre
// la card blanca como sobre la card oscura, sin depender de esa herencia.
const AXIS_TEXT_COLOR = '#6b7280'

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
  const { machineId = '' } = useParams()
  const { user } = useAuth()
  const { machine, loading: machineLoading } = useMachineById(machineId)
  const { history, loading: historyLoading } = useMachineHistory(machineId, user?.id ?? null)

  if (machineLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <p className="text-base font-normal text-gray-700 dark:text-gray-300">
            No encontramos esa máquina.
          </p>
          <Link to="/home" className="w-full">
            <Button variant="secondary">Volver a Home</Button>
          </Link>
        </Card>
      </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">{machine.name}</h1>

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
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Link to="/home" className="w-full">
          <Button variant="secondary">Volver a Home</Button>
        </Link>
      </div>
    </div>
  )
}
