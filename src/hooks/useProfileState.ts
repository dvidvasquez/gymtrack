import { useCallback, useEffect, useState } from 'react'
import {
  createProfile,
  getProfileByUserId,
  updateProfile,
  type ProfileDetailsInput,
} from '../lib/services/profiles'
import type { Profile } from '../types/domain'
import type { ProfileFormInput } from './useProfile'

export interface ProfileState {
  profile: Profile | null
  loading: boolean
  // No null cuando falló la carga (red, Supabase caído). Distinto de
  // `profile === null` sin error, que sí significa "este usuario todavía no
  // tiene perfil" — confundirlos mandaba al usuario a /onboarding por un
  // error de red, y ahí guardar intentaba crear un perfil duplicado.
  error: string | null
  retry: () => void
  saveProfileDetails: (input: ProfileFormInput) => Promise<Profile>
}

interface FetchedProfile {
  userId: string | null
  profile: Profile | null
  error: string | null
}

// Los máximos y la fecha mínima son exclusivos, igual que los `check` de
// supabase/migrations/20260917000000_profile_biometrics.sql — si no, un valor
// justo en el borde (ej. 500 kg) pasaba esta validación y fallaba en la base
// con un error crudo de Postgres.
const MIN_WEIGHT_KG = 1
const MAX_WEIGHT_KG = 500
const MIN_HEIGHT_CM = 1
const MAX_HEIGHT_CM = 300
const MIN_BIRTH_DATE = new Date('1900-01-01')

const LOAD_ERROR_MESSAGE = 'No se pudo cargar tu perfil. Revisá tu conexión y reintentá.'

// Perfil del usuario logueado. Se ejecuta **una sola vez**, en
// components/SessionProvider.tsx, con el userId de useAuthState; el resto de
// la app lo lee con useProfile(). Antes cada guard/página lo consultaba por su
// cuenta (una consulta por pantalla) y un guardado en una pantalla no se
// enteraba en las otras.
export function useProfileState(userId: string | null): ProfileState {
  const [fetched, setFetched] = useState<FetchedProfile>({
    userId: null,
    profile: null,
    error: null,
  })
  const [fetching, setFetching] = useState(userId !== null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) {
      setFetched({ userId: null, profile: null, error: null })
      setFetching(false)
      return
    }

    let cancelled = false
    setFetching(true)
    getProfileByUserId(userId)
      .then((result) => {
        if (cancelled) return
        setFetched({ userId, profile: result, error: null })
        setFetching(false)
      })
      .catch(() => {
        if (cancelled) return
        setFetched({ userId, profile: null, error: LOAD_ERROR_MESSAGE })
        setFetching(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  // fetched.userId puede seguir apuntando al userId anterior por un render,
  // hasta que el effect de arriba corra para el nuevo userId. Mientras tanto
  // hay que reportar "cargando" en vez de devolver el perfil viejo (o null)
  // como si fuera la respuesta definitiva para el usuario actual.
  const isStale = fetched.userId !== userId
  const loading = userId !== null && (isStale || fetching)
  const profile = isStale ? null : fetched.profile
  const error = isStale ? null : fetched.error

  const retry = useCallback(() => setAttempt((prev) => prev + 1), [])

  const saveProfileDetails = useCallback(
    async (input: ProfileFormInput) => {
      if (!userId) throw new Error('No hay usuario autenticado')
      // Sin esto, con la carga fallida `profile` es null y se intentaría
      // crear un perfil nuevo encima del que ya existe.
      if (error) throw new Error(LOAD_ERROR_MESSAGE)

      const displayName = input.displayName.trim()
      if (!displayName) throw new Error('El nombre no puede estar vacío')

      if (
        !Number.isFinite(input.weightKg) ||
        input.weightKg < MIN_WEIGHT_KG ||
        input.weightKg >= MAX_WEIGHT_KG
      ) {
        throw new Error('Ingresá un peso válido en kg')
      }

      if (
        !Number.isFinite(input.heightCm) ||
        input.heightCm < MIN_HEIGHT_CM ||
        input.heightCm >= MAX_HEIGHT_CM
      ) {
        throw new Error('Ingresá una estatura válida en cm')
      }

      const birthDate = new Date(input.birthDate)
      if (
        Number.isNaN(birthDate.getTime()) ||
        birthDate <= MIN_BIRTH_DATE ||
        birthDate > new Date()
      ) {
        throw new Error('Ingresá una fecha de nacimiento válida')
      }

      const details: ProfileDetailsInput = {
        displayName,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        birthDate: input.birthDate,
      }

      const saved = profile
        ? await updateProfile(userId, details)
        : await createProfile(userId, details)

      setFetched({ userId, profile: saved, error: null })
      return saved
    },
    [userId, profile, error],
  )

  return { profile, loading, error, retry, saveProfileDetails }
}
