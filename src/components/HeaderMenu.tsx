import { IconBarbell, IconLogout, IconMenu2, IconUser } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Menú hamburguesa del header: acciones/navegación globales que no ameritan
// espacio permanente en el footer ni repetirse por página.
export function HeaderMenu() {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Menú"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-11 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
      >
        <IconMenu2 size={22} stroke={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-sm"
        >
          <Link
            to="/exercises"
            viewTransition
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconBarbell size={18} stroke={2} />
            Ejercicios
          </Link>
          <Link
            to="/profile"
            viewTransition
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconUser size={18} stroke={2} />
            Perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconLogout size={18} stroke={2} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
