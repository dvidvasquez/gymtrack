import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { ProfileForm } from '../components/ProfileForm'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { isProfileComplete, useProfile } from '../hooks/useProfile'

const ONBOARDING_FORM_ID = 'onboarding-form'

interface OnboardingLocationState {
  from?: Location
}

export function OnboardingPage() {
  const { user } = useAuth()
  const { profile, loading, saveProfileDetails } = useProfile(user?.id ?? null)
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as OnboardingLocationState | null)?.from
  const destination = from ? `${from.pathname}${from.search}` : '/home'

  if (isProfileComplete(profile)) return <Navigate to={destination} replace />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            {profile ? 'Completá tu perfil' : 'Contanos quién sos'}
          </h1>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Esta información se usa para identificar tus registros y, más adelante, generar
            informes de tu progreso.
          </p>
        </div>

        <ProfileForm
          formId={ONBOARDING_FORM_ID}
          profile={profile}
          onSave={async (input) => {
            setSubmitting(true)
            try {
              return await saveProfileDetails(input)
            } finally {
              setSubmitting(false)
            }
          }}
          onSuccess={() => navigate(destination, { viewTransition: true })}
        />

        <Button type="submit" form={ONBOARDING_FORM_ID} disabled={submitting}>
          {submitting ? 'Guardando...' : 'Continuar'}
        </Button>
      </Card>
    </div>
  )
}
