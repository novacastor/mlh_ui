import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', label, error, id, ...props },
  ref,
) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="flex w-full flex-col gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground
          outline-none transition-[box-shadow,border-color] duration-200
          placeholder:text-muted/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/25
          ${error ? 'border-danger/60 focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
})
