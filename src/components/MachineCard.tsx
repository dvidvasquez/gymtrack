import { Link } from 'react-router-dom'
import type { LogEntry, Machine } from '../types/domain'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

interface MachineCardProps {
  machine: Machine
  lastEntry: LogEntry
}

export function MachineCard({ machine, lastEntry }: MachineCardProps) {
  return (
    <Link to={`/progress/${machine.id}`} viewTransition>
      <Card className="flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{machine.name}</h2>
          {machine.muscleGroup && <Badge>{machine.muscleGroup}</Badge>}
        </div>
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          {lastEntry.weightKg} kg × {lastEntry.reps} reps × {lastEntry.sets} series
        </p>
      </Card>
    </Link>
  )
}
