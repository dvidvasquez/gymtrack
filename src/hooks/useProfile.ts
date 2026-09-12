import { useCallback, useEffect, useState } from 'react'
import { createProfile, getProfileByUserId } from '../lib/services/profiles'
import type { Profile } from '../types/domain'

interface UseProfileResult {
  profile: Profile | null
  loading: boolean
  createProfile: (displayName: string) => Promise<Profile>
}

interface FetchedProfile {
  userId: string | null
  profile: Profile | null
}

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
    getProfileByUserId(userId).then((result) => {
      if (cancelled) return
      setFetched({ userId, profile: result })
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

  const handleCreateProfile = useCallback(
    async (displayName: string) => {
      if (!userId) throw new Error('No hay usuario autenticado')

      const trimmed = displayName.trim()
      if (!trimmed) throw new Error('El nombre no puede estar vacío')

      const created = await createProfile(userId, trimmed)
      setFetched({ userId, profile: created })
      return created
    },
    [userId],
  )

  return { profile, loading, createProfile: handleCreateProfile }
}
