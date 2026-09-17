import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import {
  getSession,
  signInWithGoogle,
  signOut,
  subscribeToAuthChanges,
} from '../lib/services/auth'

interface UseAuthResult {
  user: User | null
  loading: boolean
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return subscribeToAuthChanges((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  return { user, loading, signInWithGoogle, signOut }
}
