import { IconBarbell, IconDeviceFloppy, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { FooterActionContext, type FooterActionKind, type FooterActionState } from './FooterActionContext'
import { HeaderMenu } from './HeaderMenu'
import { Button } from './ui/Button'
import { LinkButton } from './ui/LinkButton'

const DEFAULT_ACTION: FooterActionState = {
  kind: 'register',
  to: '/log',
  label: 'Registrar ejercicio',
}

const ICON_BY_KIND: Record<FooterActionKind, typeof IconBarbell> = {
  register: IconBarbell,
  add: IconPlus,
  save: IconDeviceFloppy,
}

// Envuelve todas las pantallas post-login (Home, Scan, Log, Progress,
// Profile) con un header fijo (marca + menú, con acceso a Home) y un
// footer fijo con una sola acción siempre disponible, para que ninguna
// pantalla — ScanPage incluida — deje al usuario sin forma de volver al
// inicio. Esa acción es dinámica según la página activa (ver
// FooterActionContext / useFooterAction): por defecto lleva al selector
// de método de registro (/log, ver LogEntryPage), pero ProgressPage la
// cambia a "agregar registro" y LogPage/ProfilePage/etc. a "guardar".
export function AppShell() {
  const [footerAction, setFooterAction] = useState<FooterActionState | null>(null)
  const action = footerAction ?? DEFAULT_ACTION
  const Icon = ICON_BY_KIND[action.kind]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
        <Link
          to="/home"
          viewTransition
          className="text-lg font-medium text-gray-900 dark:text-gray-100"
        >
          GymTrack
        </Link>
        <HeaderMenu />
      </header>

      <main className="flex-1 p-4 pb-28 md:p-6 md:pb-28">
        <div className="max-w-md mx-auto">
          <FooterActionContext.Provider value={setFooterAction}>
            <Outlet />
          </FooterActionContext.Provider>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="max-w-md mx-auto">
          {action.kind === 'save' ? (
            <Button
              type="submit"
              form={action.formId}
              disabled={action.disabled}
              aria-label={action.label}
              className="flex items-center justify-center"
            >
              <Icon size={22} stroke={2} />
            </Button>
          ) : (
            <LinkButton
              to={action.to ?? '/log'}
              viewTransition
              aria-label={action.label}
              className="flex items-center justify-center"
            >
              <Icon size={22} stroke={2} />
            </LinkButton>
          )}
        </div>
      </footer>
    </div>
  )
}
