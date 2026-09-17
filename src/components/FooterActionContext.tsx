import { createContext, useContext, useEffect } from 'react'

// El footer de AppShell muestra una sola acción a la vez, pero cuál
// depende de la página activa (Home → escanear, Progress → agregar
// registro, Log → guardar). Las páginas se "registran" acá con
// useFooterAction en vez de que AppShell sepa de antemano qué mostrar
// por ruta — así cada página decide su propia acción (y sus datos
// dinámicos, como el qrCode de la máquina) sin que AppShell tenga que
// duplicar esas consultas.
export type FooterActionKind = 'scan' | 'add' | 'save'

export interface FooterActionState {
  kind: FooterActionKind
  label: string
  // 'scan' | 'add': navega a esta ruta.
  to?: string
  // 'save': dispara el submit del <form> con este id (puede estar en
  // otra parte del árbol — el atributo `form` de HTML no requiere que
  // el botón esté dentro del <form>).
  formId?: string
  disabled?: boolean
}

type SetFooterAction = (action: FooterActionState | null) => void

export const FooterActionContext = createContext<SetFooterAction | null>(null)

export function useFooterAction(action: FooterActionState | null): void {
  const setFooterAction = useContext(FooterActionContext)

  useEffect(() => {
    setFooterAction?.(action)
    return () => setFooterAction?.(null)
    // Dependemos de los valores primitivos de `action`, no del objeto
    // (que es una identidad nueva en cada render de la página que llama
    // a este hook).
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [setFooterAction, action?.kind, action?.label, action?.to, action?.formId, action?.disabled])
}
