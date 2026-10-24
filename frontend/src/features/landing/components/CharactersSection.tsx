import { useTranslation } from 'react-i18next'

/** Cast of the landing; the texts live in es.json under landing.characters.<id>. */
const CHARACTERS = ['tsuki', 'hikari', 'researcher'] as const

export function CharactersSection() {
  const { t } = useTranslation()
  return (
    <section id="characters" aria-labelledby="characters-title" data-section="characters">
      <h2 id="characters-title">{t('landing.characters.title')}</h2>
      <ul>
        {CHARACTERS.map((id) => (
          <li key={id} data-character={id}>
            <article>
              <h3>{t(`landing.characters.${id}.name`)}</h3>
              <p>{t(`landing.characters.${id}.role`)}</p>
              <p>{t(`landing.characters.${id}.text`)}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}