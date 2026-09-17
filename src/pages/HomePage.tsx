import { Link } from 'react-router-dom'
import { MachineCard } from '../components/MachineCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useRecentActivity } from '../hooks/useRecentActivity'

export function HomePage() {
  const { user, signOut } = useAuth()
  const { activity, loading } = useRecentActivity(user?.id ?? null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Home</h1>

        <Link to="/scan" className="w-full">
          <Button>Escanear máquina</Button>
        </Link>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Actividad reciente
          </h2>
          {loading ? (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
          ) : activity.length === 0 ? (
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">
              Todavía no registraste ningún entrenamiento.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map(({ machine, lastEntry }) => (
                <MachineCard key={machine.id} machine={machine} lastEntry={lastEntry} />
              ))}
            </div>
          )}
        </div>

        <Button variant="secondary" onClick={signOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
