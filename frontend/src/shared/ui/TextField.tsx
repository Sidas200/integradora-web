import { useId, type InputHTMLAttributes, type Ref } from 'react'
import css from './Field.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Already translated message; when present the field is marked invalid. */
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Label + input + hint + error linked by aria-describedby (README §9.5).
 * Works with React Hook Form: <TextField label="Correo" {...register('email')} error={...} />
 */
export function TextField({ label, error, hint, id, ref, className, ...input }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div data-field="" className={css.field}>
      <label htmlFor={inputId} className={css.label}>{label}</label>
      <input
        {...input}
        id={inputId}
        ref={ref}
        className={[css.control, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && <p id={hintId} className={css.hint}>{hint}</p>}
      {error && <p id={errorId} role="alert" className={css.error}>{error}</p>}
    </div>
  )
}
