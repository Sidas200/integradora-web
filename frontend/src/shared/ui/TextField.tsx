import { useId, type InputHTMLAttributes, type Ref } from 'react'

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
export function TextField({ label, error, hint, id, ref, ...input }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div data-field="">
      <label htmlFor={inputId}>{label}</label>
      <input {...input} id={inputId} ref={ref} aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
      {hint && <p id={hintId}>{hint}</p>}
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  )
}