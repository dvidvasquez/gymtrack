import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

interface UseQrScannerResult {
  error: string | null
}

function isStoppable(scanner: Html5Qrcode): boolean {
  // La propiedad pública `scanner.isScanning` puede quedar desincronizada
  // del estado interno real de la librería justo cuando `.start()`
  // resuelve (visto empíricamente: isScanning=false con getState()=SCANNING
  // al mismo tiempo). `.stop()` internamente chequea
  // `getState() !== NOT_STARTED`, así que usamos exactamente ese criterio
  // acá para no confiar en `isScanning`.
  return scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED
}

export function useQrScanner(elementId: string, onDecode: (text: string) => void): UseQrScannerResult {
  const [error, setError] = useState<string | null>(null)
  const onDecodeRef = useRef(onDecode)

  useEffect(() => {
    onDecodeRef.current = onDecode
  })

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId)
    let hasScanned = false
    let cancelled = false

    const stopAndClear = () => {
      if (!isStoppable(scanner)) return
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (hasScanned) return
          hasScanned = true
          onDecodeRef.current(decodedText)
        },
        undefined,
      )
      .then(() => {
        // El efecto puede haberse desmontado mientras la cámara todavía
        // estaba inicializando (p. ej. StrictMode en desarrollo monta,
        // limpia y vuelve a montar de inmediato). Si eso pasó, recién acá
        // sabemos que el scanner arrancó, así que hay que pararlo ahora.
        if (cancelled) stopAndClear()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo acceder a la cámara')
        }
      })

    return () => {
      cancelled = true
      stopAndClear()
    }
  }, [elementId])

  return { error }
}
