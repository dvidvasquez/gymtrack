import { useContext } from 'react'
import type { ProfileDetailsInput } from '../lib/services/profiles'
import type { Profile } from '../types/domain'
import { SessionContext } from './sessionContext'
import type { ProfileState } from './useProfileState'

export type ProfileFormInput = ProfileDetailsInput

// Un perfil "completo" tiene todo lo necesario para generar informes más
// adelante (peso, estatura, fecha de nacimiento) además del nombre. Hasta
// que no esté completo, RequireProfile manda al usuario a completarlo.
export function isProfileComplete(profile: Profile | null): boolean {
  return (
    profile !== null &&
    profile.weightKg !== null &&
    profile.heightCm !== null &&
    profile.birthDate !== null
  )
}

// El rol se otorga a mano (SQL directo), nunca autootorgado al loguearse —
// ver migración 20260918000000_exercises_and_roles.sql. Solo un 'owner'
// puede crear/editar/borrar ejercicios del catálogo compartido.
export function isOwner(profile: Profile | null): boolean {
  return profile?.role === 'owner'
}

// Perfil del usuario logueado, compartido por toda la app (ver
// components/SessionProvider): se consulta una vez y, al guardarlo desde
// Onboarding o Perfil, todas las pantallas ven el cambio.
export function useProfile(): ProfileState {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useProfile tiene que usarse dentro de SessionProvider')
  return session.profile
}
