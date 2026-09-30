import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface LoadErrorCardProps {
  message: string
  onRetry: () => void
}

// Estado de error de una carga que se puede reintentar (hoy: el perfil, en
// RequireProfile/RequireOwner/Onboarding/Profile). Sin layout propio: quien
// lo usa decide si va a pantalla completa (fuera de AppShell) o dentro del
// shell.
export function LoadErrorCard({ message, onRetry }: LoadErrorCardProps) {
  return (
    <Card className="w-full max-w-md flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-normal text-amber-600">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </Card>
  )
}
