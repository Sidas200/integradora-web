import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SelectField } from './SelectField'

const options = [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]

describe('SelectField', () => {
  it('la etiqueta nombra al select y muestra las opciones', () => {
    render(<SelectField label="Idioma" options={options} />)
    const select = screen.getByRole('combobox', { name: 'Idioma' })
    expect(select).not.toHaveAttribute('aria-invalid')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Español', 'English'])
  })

  it('con error lo anuncia y lo enlaza con aria-describedby', () => {
    render(<SelectField label="Idioma" options={options} error="Elige un idioma." id="language" />)
    const select = screen.getByRole('combobox', { name: 'Idioma' })

    expect(select).toHaveAttribute('id', 'language')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Elige un idioma.')
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'language-error')
  })
})