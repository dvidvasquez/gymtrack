import { createContext } from 'react'
import type { AuthState } from './useAuthState'
import type { ProfileState } from './useProfileState'

// Sesión + perfil del usuario, calculados una sola vez por SessionProvider y
// leídos con useAuth() / useProfile(). No es state management global de
// datos del servidor (cada pantalla sigue trayendo lo suyo con sus hooks):
// solo comparte las dos cosas que casi todas las pantallas y guards usan.
export interface SessionValue {
  auth: AuthState
  profile: ProfileState
}

export const SessionContext = createContext<SessionValue | null>(null)
