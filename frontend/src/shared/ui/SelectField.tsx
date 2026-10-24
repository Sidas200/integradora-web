import { useId, type Ref, type SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  ref?: Ref<HTMLSelectElement>
}

/** Label + native select + error. Works with React Hook Form's register(). */
export function SelectField({ label, options, error, id, ref, ...select }: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <div data-field="select">
      <label htmlFor={selectId}>{label}</label>
      <select {...select} id={selectId} ref={ref} aria-invalid={error ? true : undefined} aria-describedby={errorId}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  )
}