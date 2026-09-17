import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isOwner, useProfile } from '../hooks/useProfile'

// Gatea las pantallas de alta/edición de ejercicios a perfiles con
// role='owner'. El RLS de la migración de Fase 8 ya lo impide a nivel de
// datos — esto es solo para no mostrarle a un 'member' un formulario que
// va a fallar al guardar.
export function RequireOwner() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null)

  if (authLoading || profileLoading) return null
  if (!isOwner(profile)) return <Navigate to="/exercises" replace />

  return <Outlet />
}
