import { IconCircleCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useFooterAction } from '../components/FooterActionContext'
import { ProfileForm } from '../components/ProfileForm'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

const PROFILE_FORM_ID = 'profile-form'
const SUCCESS_TIMEOUT_MS = 3000

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, saveProfileDetails } = useProfile(user?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // El botón de guardar vive en el footer de AppShell, igual que en LogPage.
  useFooterAction({
    kind: 'save',
    formId: PROFILE_FORM_ID,
    label: 'Guardar cambios',
    disabled: saving,
  })

  if (loading) {
    return <p className="text-base font-normal text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Perfil</h1>

      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-3 py-2 text-sm font-normal text-green-700 dark:text-green-400">
          <IconCircleCheck size={18} stroke={2} />
          Perfil actualizado
        </div>
      )}

      <Card>
        <ProfileForm
          formId={PROFILE_FORM_ID}
          profile={profile}
          onSave={async (input) => {
            setSaving(true)
            try {
              return await saveProfileDetails(input)
            } finally {
              setSaving(false)
            }
          }}
          onSuccess={() => {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), SUCCESS_TIMEOUT_MS)
          }}
        />
      </Card>
    </div>
  )
}
