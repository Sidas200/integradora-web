import { BookOpen, Download, Newspaper, Save, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CHARACTERS, KEY_ART } from '@/shared/ui/art'
import { MOBILE_APP_URL } from '../config'
import css from '../landing.module.css'


const FEATURES = [
  { id: 'saves', Icon: Save },
  { id: 'achievements', Icon: Trophy },
  { id: 'news', Icon: Newspaper },
  { id: 'account', Icon: BookOpen },
] as const

/** Companion app (Flutter, Android): what it does, the download and a phone showing it. */
export function AppSection() {
  const { t } = useTranslation()
  return (
    <section id="app" aria-labelledby="app-title" data-section="app" className={css.section}>
      <div className={`${css.inner} ${css.appLayout}`}>
        <div className={css.reveal}>
          <p className={css.eyebrow}>{t('landing.app.eyebrow')}</p>
          <h2 id="app-title" className={css.h2}>{t('landing.app.title')}</h2>
          <p className={css.lead}>{t('landing.app.text')}</p>
          <ul className={css.appFeatures}>
            {FEATURES.map(({ id, Icon }) => (
              <li key={id}><Icon size={18} aria-hidden="true" />{t(`landing.app.features.${id}`)}</li>
            ))}
          </ul>
          <p className={css.appActions}>
            <a href={MOBILE_APP_URL} className={css.btnPromise} target="_blank" rel="noreferrer">
              <Download size={18} aria-hidden="true" />{t('landing.app.download')}
            </a>
            <small>{t('landing.app.note')}</small>
          </p>
        </div>

        {/* Phone mock-up with the app's home screen (decorative) */}
        <div className={`${css.phone} ${css.reveal}`} aria-hidden="true">
          <div className={css.phoneScreen}>
            <div className={css.phoneHero}>
              <img src={KEY_ART.src} alt="" loading="lazy" />
              <img src={CHARACTERS.tsuki.sprite} alt="" className={css.phoneSprite} loading="lazy" />
            </div>
            <div className={css.phoneBody}>
              <small>{t('landing.app.mock.last')}</small>
              <strong>{t('landing.app.mock.save')}</strong>
              <span className={css.phoneBar}><i /></span>
              <div className={css.phoneRow}>
                <span><Trophy size={14} /> 2/6</span>
                <span><Save size={14} /> 3</span>
                <span><Newspaper size={14} /> 12</span>
              </div>
              <div className={css.phoneTabs}><i data-active="" /><i /><i /><i /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
