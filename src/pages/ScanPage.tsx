import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQrScanner } from '../hooks/useQrScanner'

const SCANNER_ELEMENT_ID = 'qr-scanner'

// El QR de una máquina codifica la URL completa (para que la cámara nativa
// del celular abra la app directo ahí, ver .claude/CLAUDE.md). Si lo lee el
// scanner de la propia app, alcanza con navegar a esa misma ruta interna en
// vez de salir a una URL absoluta. Se mantiene el fallback al código pelado
// por si queda algún QR físico viejo (pre-URL) sin reimprimir todavía.
function resolveLogPath(decodedText: string): string {
  try {
    return new URL(decodedText).pathname
  } catch {
    return `/log/${encodeURIComponent(decodedText)}`
  }
}

export function ScanPage() {
  const navigate = useNavigate()

  const handleDecode = useCallback(
    (decodedText: string) => {
      navigate(resolveLogPath(decodedText), { viewTransition: true })
    },
    [navigate],
  )

  const { error } = useQrScanner(SCANNER_ELEMENT_ID, handleDecode)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center">
        Escaneá el QR de la máquina
      </h1>
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      />
      {error && <p className="text-sm font-normal text-amber-600 text-center">{error}</p>}
    </div>
  )
}
