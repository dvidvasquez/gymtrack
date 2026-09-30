import { useCallback, useEffect, useState } from 'react'
import type { Theme } from '../types/domain'

// Misma clave que el script inline de index.html, que aplica el tema antes
// de que cargue React. Si se cambia acá, cambiarla también ahí.
const STORAGE_KEY = 'gymtrack.theme'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  // Para que los controles nativos (selects, date pickers, scrollbars) sigan
  // el tema de la app y no el del sistema.
  document.documentElement.style.colorScheme = theme
}

// Tema claro/oscuro, recordado por dispositivo (preferencia de comodidad, no
// va a Supabase). Mientras el usuario no elija uno, sigue el modo del
// sistema, también si cambia con la app abierta. El estado inicial se lee de
// <html>, donde index.html ya aplicó el tema correcto.
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [hasChoice, setHasChoice] = useState(() => readStoredTheme() !== null)

  useEffect(() => {
    if (hasChoice) return
    const query = window.matchMedia(SYSTEM_DARK_QUERY)
    function handleChange(event: MediaQueryListEvent) {
      const next: Theme = event.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [hasChoice])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    setHasChoice(true)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento disponible: el tema vale hasta recargar.
    }
  }, [theme])

  return { theme, toggleTheme }
}
