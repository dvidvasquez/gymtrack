interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
}

// Selector de una opción entre pocas (kg/lb, métrica del gráfico). Accesible
// como radiogroup; la opción activa usa el acento (ver DESIGN.md).
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="w-fit flex rounded-lg border border-gray-200 dark:border-gray-800 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-8 min-w-12 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
            value === option.value
              ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
