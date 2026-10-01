import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import {
  getSession,
  signInWithGoogle,
  signOut,
  subscribeToAuthChanges,
} from '../lib/services/auth'

export interface AuthState {
  user: User | null
  loading: boolean
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signOut: () => Promise<void>
}

// Estado de la sesión de Supabase. Se ejecuta **una sola vez**, en
// components/SessionProvider.tsx; el resto de la app lo lee con useAuth()
// (una sola suscripción a onAuthStateChange en vez de una por componente).
export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession()
      .then((session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        // Sin sesión legible se trata como deslogueado (→ /login) en vez de
        // dejar los guards en `loading` para siempre (pantalla en blanco).
        setUser(null)
        setLoading(false)
      })

    return subscribeToAuthChanges((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  return { user, loading, signInWithGoogle, signOut }
}
