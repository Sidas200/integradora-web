import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import css from './PageHeader.module.css'

/** Page h1 + document title ("Noticias · The Day I Made That Promise"). */
export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`
  }, [title, t])

  return (
    <header className={css.header}>
      {eyebrow && <p className={css.eyebrow}>{eyebrow}</p>}
      <h1 className={css.title}>{title}</h1>
      {children && <div className={css.sub}>{children}</div>}
    </header>
  )
}
