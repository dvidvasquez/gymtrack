import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isProfileComplete, useProfile } from '../hooks/useProfile'

export function RequireProfile() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null)

  if (authLoading || profileLoading) return null
  if (!isProfileComplete(profile)) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
