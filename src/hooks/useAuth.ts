import { useContext } from 'react'
import { SessionContext } from './sessionContext'
import type { AuthState } from './useAuthState'

// Sesión actual, compartida por toda la app (ver components/SessionProvider).
export function useAuth(): AuthState {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useAuth tiene que usarse dentro de SessionProvider')
  return session.auth
}
