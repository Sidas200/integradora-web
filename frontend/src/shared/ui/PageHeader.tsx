import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Page h1 + document title ("Noticias · The Day I Made That Promise"). */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`
  }, [title, t])

  return (
    <header>
      <h1>{title}</h1>
      {children}
    </header>
  )
}

/** Temporary content of a screen that a later phase implements. */
export function PendingPage({ title, phase }: { title: string; phase: number }) {
  const { t } = useTranslation()
  return (
    <section>
      <PageHeader title={title} />
      <p>{t('common.pending', { phase })}</p>
    </section>
  )
}