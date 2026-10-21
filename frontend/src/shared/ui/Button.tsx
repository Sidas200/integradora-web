import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'promise' | 'outline' | 'danger'
  loading?: boolean
}

/**
 * No styles yet: `data-variant` and `aria-busy` are the hooks for Button.module.css
 * in the design phase. type="button" by default so it never submits a form by accident.
 */
export function Button({ variant = 'primary', loading = false, disabled, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button {...rest} type={type} data-variant={variant} disabled={disabled || loading} aria-busy={loading}>
      {children}
    </button>
  )
}