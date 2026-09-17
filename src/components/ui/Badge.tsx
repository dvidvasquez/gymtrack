import type { HTMLAttributes } from 'react'

export function Badge({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 ${className}`}
      {...props}
    />
  )
}
