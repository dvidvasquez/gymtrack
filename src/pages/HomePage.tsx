import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Home</h1>
        <Button variant="secondary" onClick={signOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
