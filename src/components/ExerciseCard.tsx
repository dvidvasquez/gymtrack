import { Link } from 'react-router-dom'
import { formatEntrySummary } from '../hooks/useLogEntry'
import type { Exercise, LogEntry, WeightUnit } from '../types/domain'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

interface ExerciseCardProps {
  exercise: Exercise
  lastEntry: LogEntry
  unit: WeightUnit
}

export function ExerciseCard({ exercise, lastEntry, unit }: ExerciseCardProps) {
  return (
    <Link to={`/progress/${exercise.id}`} viewTransition>
      <Card className="flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h2>
          {exercise.muscleGroup && <Badge>{exercise.muscleGroup}</Badge>}
        </div>
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">
          {formatEntrySummary(lastEntry, unit)}
        </p>
      </Card>
    </Link>
  )
}
