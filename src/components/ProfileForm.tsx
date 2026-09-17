import { useState, type FormEvent } from 'react'
import type { ProfileFormInput } from '../hooks/useProfile'
import { Input } from './ui/Input'
import type { Profile } from '../types/domain'

interface ProfileFormProps {
  formId: string
  profile: Profile | null
  onSave: (input: ProfileFormInput) => Promise<Profile>
  onSuccess?: () => void
}

// Sin botón propio a propósito: quien use este form decide dónde vive el
// trigger de guardado (un botón normal en OnboardingPage, el footer de
// AppShell en ProfilePage) — ambos lo conectan vía el atributo HTML
// `form={formId}`, el mismo patrón que ya usa LogPage.
export function ProfileForm({ formId, profile, onSave, onSuccess }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [weightKg, setWeightKg] = useState(profile?.weightKg?.toString() ?? '')
  const [heightCm, setHeightCm] = useState(profile?.heightCm?.toString() ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onSave({
        displayName,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        birthDate,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-normal text-gray-500 dark:text-gray-400">
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

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="weightKg" className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Peso (kg)
          </label>
          <Input
            id="weightKg"
            type="number"
            inputMode="decimal"
            min="1"
            max="500"
            step="0.1"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="heightCm" className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Estatura (cm)
          </label>
          <Input
            id="heightCm"
            type="number"
            inputMode="numeric"
            min="1"
            max="300"
            step="1"
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="birthDate" className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Fecha de nacimiento
        </label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm font-normal text-amber-600">{error}</p>}
    </form>
  )
}
