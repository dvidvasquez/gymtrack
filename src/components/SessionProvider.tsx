import { useMemo, type ReactNode } from 'react'
import { SessionContext } from '../hooks/sessionContext'
import { useAuthState } from '../hooks/useAuthState'
import { useProfileState } from '../hooks/useProfileState'

// Único lugar donde se escucha la sesión de Supabase y se consulta el perfil
// (ver hooks/sessionContext.ts). Envuelve toda la app en App.tsx.
export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState()
  const profile = useProfileState(auth.user?.id ?? null)
  const value = useMemo(() => ({ auth, profile }), [auth, profile])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
