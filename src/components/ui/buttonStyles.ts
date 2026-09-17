export type ButtonVariant = 'primary' | 'secondary'

const baseClasses =
  'w-full h-11 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-red-500 text-white hover:bg-red-600',
  secondary:
    'border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = ''): string {
  return `${baseClasses} ${variantClasses[variant]} ${className}`
}
