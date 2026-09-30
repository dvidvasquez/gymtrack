import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isProfileComplete, useProfile } from '../hooks/useProfile'
import { LoadErrorCard } from './LoadErrorCard'

export function RequireProfile() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, error, retry } = useProfile(user?.id ?? null)
  const location = useLocation()

  if (authLoading || profileLoading) return null
  // Un error de carga no es "no tiene perfil": mandarlo a /onboarding acá
  // haría que guardar intente crear un perfil duplicado.
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <LoadErrorCard message={error} onRetry={retry} />
      </div>
    )
  }
  if (!isProfileComplete(profile)) return <Navigate to="/onboarding" state={{ from: location }} replace />

  return <Outlet />
}
