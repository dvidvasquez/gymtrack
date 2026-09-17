import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQrScanner } from '../hooks/useQrScanner'

const SCANNER_ELEMENT_ID = 'qr-scanner'

export function ScanPage() {
  const navigate = useNavigate()

  const handleDecode = useCallback(
    (qrCode: string) => {
      navigate(`/log/${encodeURIComponent(qrCode)}`, { viewTransition: true })
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
