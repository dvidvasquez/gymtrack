import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { buttonClasses, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant
}

// Botón que navega en vez de disparar una acción: usa <Link> por debajo
// (nunca anidar un <button> real dentro de un <a>, es HTML inválido) pero
// mantiene el mismo look que Button.
export function LinkButton({ variant = 'primary', className = '', ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />
}
