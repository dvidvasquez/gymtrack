import { lazy, type ComponentType } from 'react'

const RELOAD_FLAG = 'gymtrack.chunkReload'

function alreadyReloaded(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) === '1'
  } catch {
    return true
  }
}

function setReloaded(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(RELOAD_FLAG, '1')
    else sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    // Sin sessionStorage no se puede evitar un loop de recargas: no se recarga.
  }
}

// Página cargada recién cuando se navega a ella (code-splitting con
// React.lazy), para que las librerías pesadas (html5-qrcode, recharts) no
// estén en la carga inicial. Las páginas usan named exports, así que `load`
// devuelve el componente y acá se adapta al `{ default }` que espera lazy.
//
// Si el chunk no se puede descargar estando online, casi seguro es un deploy
// nuevo mientras la app estaba abierta (Vercel ya no sirve los archivos del
// build anterior): se recarga la página una sola vez para traer la versión
// nueva. Offline, o si ya se recargó, el error sigue hasta PageErrorBoundary.
export function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => {
    try {
      const Component = await load()
      setReloaded(false)
      return { default: Component }
    } catch (error) {
      if (navigator.onLine && !alreadyReloaded()) {
        setReloaded(true)
        window.location.reload()
        return new Promise<never>(() => {})
      }
      throw error
    }
  })
}
