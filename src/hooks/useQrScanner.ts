import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

interface UseQrScannerResult {
  error: string | null
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
      if (!scanner.isScanning) return
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
