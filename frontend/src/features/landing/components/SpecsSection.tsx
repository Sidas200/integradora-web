import { useTranslation } from 'react-i18next'

/** Rows of the fact sheet; each one has <row>Label and <row> in es.json under landing.specs. */
const ROWS = ['genre', 'platform', 'engine', 'length', 'language', 'studio', 'release'] as const

export function SpecsSection() {
  const { t } = useTranslation()
  return (
    <section id="specs" aria-labelledby="specs-title" data-section="specs">
      <h2 id="specs-title">{t('landing.specs.title')}</h2>
      <dl>
        {ROWS.map((row) => (
          <div key={row} data-spec={row}>
            <dt>{t(`landing.specs.${row}Label`)}</dt>
            <dd>{t(`landing.specs.${row}`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}