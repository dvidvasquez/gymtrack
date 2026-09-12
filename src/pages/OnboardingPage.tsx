import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

export function OnboardingPage() {
  const { user } = useAuth()
  const { profile, createProfile } = useProfile(user?.id ?? null)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (profile) return <Navigate to="/home" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createProfile(displayName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            Contanos quién sos
          </h1>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Este nombre se va a usar para identificar tus registros.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="displayName"
              className="text-sm font-normal text-gray-500 dark:text-gray-400"
            >
              Nombre
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>
          {error && <p className="text-sm font-normal text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
