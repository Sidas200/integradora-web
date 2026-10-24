import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'

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
    <div data-field="checkbox">
      <input {...input} type="checkbox" id={inputId} ref={ref}
             aria-invalid={error ? true : undefined} aria-describedby={errorId} />
      <label htmlFor={inputId}>{label}</label>
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  )
}