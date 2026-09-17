import { IconBarbell, IconQrcode } from '@tabler/icons-react'
import { LinkButton } from '../components/ui/LinkButton'

// Punto de entrada al registro (acción por default del footer, ver
// AppShell). Antes el botón grande de Home llevaba directo a escanear;
// ahora primero deja elegir el método — escanear (flujo existente, ScanPage)
// o elegir de la lista de ejercicios (flujo existente, ExercisesPage, para
// mancuernas/barra sin QR) — y cada uno sigue el flujo de registro de
// siempre sin duplicarlo.
export function LogEntryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center">
        ¿Cómo querés registrar?
      </h1>
      <div className="flex flex-col gap-3">
        <LinkButton to="/scan" viewTransition className="flex items-center justify-center gap-2">
          <IconQrcode size={20} stroke={2} />
          Escanear QR
        </LinkButton>
        <LinkButton
          to="/exercises"
          viewTransition
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <IconBarbell size={20} stroke={2} />
          Elegir de la lista
        </LinkButton>
      </div>
    </div>
  )
}
