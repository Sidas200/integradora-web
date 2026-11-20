import type { ButtonHTMLAttributes } from 'react'
import css from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'promise' | 'outline' | 'danger' | 'ghost'
  size?: 'm' | 's'
  loading?: boolean
}

/** Pill buttons (README §9.2). type="button" by default so it never submits a form by accident. */
export function Button({
  variant = 'primary', size = 'm', loading = false, disabled, type = 'button', className, children, ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      data-variant={variant}
      data-size={size}
      className={[css.button, className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && <span className={css.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
