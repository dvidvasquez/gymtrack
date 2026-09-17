import { IconBrandGoogle } from '@tabler/icons-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { isProfileComplete, useProfile } from '../hooks/useProfile'

interface LoginLocationState {
  from?: Location
}

export function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null)
  const location = useLocation()
  const from = (location.state as LoginLocationState | null)?.from
  const destination = from ? `${from.pathname}${from.search}` : undefined

  if (!authLoading && user) {
    if (profileLoading) return null
    return (
      <Navigate
        to={isProfileComplete(profile) ? (destination ?? '/home') : '/onboarding'}
        state={{ from }}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">GymTrack</h1>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Escaneá el QR de una máquina y llevá registro de tu progreso.
          </p>
        </div>
        <Button
          onClick={() => signInWithGoogle(destination)}
          className="flex items-center justify-center gap-2"
        >
          <IconBrandGoogle size={20} stroke={2} />
          Iniciar sesión con Google
        </Button>
      </Card>
    </div>
  )
}
