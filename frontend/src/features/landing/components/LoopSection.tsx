import { useTranslation } from 'react-i18next'

/** Order of the game loop; the texts live in es.json under landing.loop.<step>. */
const STEPS = ['explore', 'fight', 'collect', 'forge', 'guardian'] as const

export function LoopSection() {
  const { t } = useTranslation()
  return (
    <section id="loop" aria-labelledby="loop-title" data-section="loop">
      <h2 id="loop-title">{t('landing.loop.title')}</h2>
      <ol>
        {STEPS.map((step) => (
          <li key={step} data-step={step}>
            <h3>{t(`landing.loop.${step}.title`)}</h3>
            <p>{t(`landing.loop.${step}.text`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}