import { useCallback, useEffect, useState } from 'react'
import {
  createProfile,
  getProfileByUserId,
  updateProfile,
  type ProfileDetailsInput,
} from '../lib/services/profiles'
import type { Profile } from '../types/domain'

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

interface UseProfileResult {
  profile: Profile | null
  loading: boolean
  saveProfileDetails: (input: ProfileFormInput) => Promise<Profile>
}

interface FetchedProfile {
  userId: string | null
  profile: Profile | null
}

const MIN_WEIGHT_KG = 1
const MAX_WEIGHT_KG = 500
const MIN_HEIGHT_CM = 1
const MAX_HEIGHT_CM = 300
const MIN_BIRTH_DATE = new Date('1900-01-01')

export function useProfile(userId: string | null): UseProfileResult {
  const [fetched, setFetched] = useState<FetchedProfile>({ userId: null, profile: null })
  const [fetching, setFetching] = useState(userId !== null)

  useEffect(() => {
    if (!userId) {
      setFetched({ userId: null, profile: null })
      setFetching(false)
      return
    }

    let cancelled = false
    setFetching(true)
    getProfileByUserId(userId)
      .then((result) => {
        if (cancelled) return
        setFetched({ userId, profile: result })
        setFetching(false)
      })
      .catch(() => {
        if (cancelled) return
        setFetched({ userId, profile: null })
        setFetching(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  // fetched.userId puede seguir apuntando al userId anterior por un render,
  // hasta que el effect de arriba corra para el nuevo userId. Mientras tanto
  // hay que reportar "cargando" en vez de devolver el perfil viejo (o null)
  // como si fuera la respuesta definitiva para el usuario actual.
  const isStale = fetched.userId !== userId
  const loading = userId !== null && (isStale || fetching)
  const profile = isStale ? null : fetched.profile

  const saveProfileDetails = useCallback(
    async (input: ProfileFormInput) => {
      if (!userId) throw new Error('No hay usuario autenticado')

      const displayName = input.displayName.trim()
      if (!displayName) throw new Error('El nombre no puede estar vacío')

      if (
        !Number.isFinite(input.weightKg) ||
        input.weightKg < MIN_WEIGHT_KG ||
        input.weightKg > MAX_WEIGHT_KG
      ) {
        throw new Error('Ingresá un peso válido en kg')
      }

      if (
        !Number.isFinite(input.heightCm) ||
        input.heightCm < MIN_HEIGHT_CM ||
        input.heightCm > MAX_HEIGHT_CM
      ) {
        throw new Error('Ingresá una estatura válida en cm')
      }

      const birthDate = new Date(input.birthDate)
      if (
        Number.isNaN(birthDate.getTime()) ||
        birthDate < MIN_BIRTH_DATE ||
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

      setFetched({ userId, profile: saved })
      return saved
    },
    [userId, profile],
  )

  return { profile, loading, saveProfileDetails }
}
