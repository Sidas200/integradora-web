import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import css from './Field.module.css'

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  /** Already translated message; when present the field is marked invalid. */
  error?: string
  ref?: Ref<HTMLInputElement>
}

/** Checkbox + label + error linked by aria-describedby. Works with React Hook Form's register(). */
export function CheckboxField({ label, error, id, ref, ...input }: CheckboxFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div data-field="checkbox" className={css.check}>
      <input {...input} type="checkbox" id={inputId} ref={ref} className={css.box}
             aria-invalid={error ? true : undefined} aria-describedby={errorId} />
      <label htmlFor={inputId} className={css.label}>{label}</label>
      {error && <p id={errorId} role="alert" className={css.error}>{error}</p>}
    </div>
  )
}
