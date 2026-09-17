import type { HTMLAttributes } from 'react'

export function Badge({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 ${className}`}
      {...props}
    />
  )
}
