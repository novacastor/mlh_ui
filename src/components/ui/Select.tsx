import { type SelectHTMLAttributes } from 'react'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string
  helperText?: string
  options: SelectOption[]
}

export function Select({ className = '', label, helperText, id, options, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s+/g, '-').toLowerCase()

  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-medium text-muted">{label}</span> : null}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full appearance-none rounded-xl border border-border bg-card/60 px-4 py-3 pr-10 text-sm text-foreground
            outline-none transition-[box-shadow,border-color] duration-200
            focus:border-primary/50 focus:ring-2 focus:ring-primary/25
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {helperText ? <p className="text-xs text-muted">{helperText}</p> : null}
    </label>
  )
}
