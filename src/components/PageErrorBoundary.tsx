import { Component, type ReactNode } from 'react'
import { LoadErrorCard } from './LoadErrorCard'

interface PageErrorBoundaryProps {
  // Al cambiar (otra ruta), se limpia el error: navegar fuera de una
  // pantalla que falló no tiene que dejar el error pegado en la siguiente.
  resetKey: string
  children: ReactNode
}

interface PageErrorBoundaryState {
  hasError: boolean
  resetKey: string
}

// Atrapa errores al renderizar una página dentro de AppShell, sobre todo
// que no se pueda descargar una página con carga diferida (ver
// router/lazyPage.ts) por falta de conexión. Muestra un error reintentable
// en vez de dejar la app en blanco, y el header/footer siguen funcionando.
// Es un class component porque React solo permite error boundaries así.
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<PageErrorBoundaryState> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(
    props: PageErrorBoundaryProps,
    state: PageErrorBoundaryState,
  ): Partial<PageErrorBoundaryState> | null {
    return props.resetKey !== state.resetKey ? { hasError: false, resetKey: props.resetKey } : null
  }

  render() {
    if (this.state.hasError) {
      return (
        <LoadErrorCard
          message="No se pudo cargar esta pantalla. Revisá tu conexión y reintentá."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
