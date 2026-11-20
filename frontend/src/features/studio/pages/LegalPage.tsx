import { useEffect } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import { COMPANY } from '../company'
import { COOKIES, PRIVACY, type LegalBlock, type LegalDocument } from '../content/legal'
import css from '../studio.module.css'

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p>{block}</p>
  if ('list' in block) return <ul>{block.list.map((item) => <li key={item}>{item}</li>)}</ul>
  return (
    <div className={css.tableWrap}>
      <table>
        <thead><tr>{block.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{block.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

/** A legal document: title, date, table of contents and its sections, on a quiet reading page. */
function LegalDocumentView({ doc, other }: { doc: LegalDocument; other: { to: string; label: string } }) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${doc.title} · ${COMPANY.name}`
  }, [doc.title])

  return (
    <article className={css.legal}>
      <header className={css.legalHeader}>
        <p className={css.kicker}>{COMPANY.name}</p>
        <h1>{doc.title}</h1>
        <p className={css.updated}>{t('studio.legal.updated', { date: formatLongDate(COMPANY.legalUpdatedAt) })}</p>
        <p className={css.legalIntro}>{doc.intro}</p>
      </header>
      <div className={css.legalBody}>
        <nav aria-label={t('studio.legal.contents')} className={css.toc}>
          <p>{t('studio.legal.contents')}</p>
          <ol>{doc.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s*/, '')}</a></li>)}</ol>
          <Link to={other.to} className={css.tocOther}>{other.label}</Link>
        </nav>
        <div className={css.prose}>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              {s.blocks.map((b, i) => <Block key={i} block={b} />)}
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}

export function PrivacyPage() {
  const { t } = useTranslation()
  return <LegalDocumentView doc={PRIVACY} other={{ to: '/cookies', label: t('studio.footer.cookies') }} />
}

export function CookiesPage() {
  const { t } = useTranslation()
  return <LegalDocumentView doc={COOKIES} other={{ to: '/privacidad', label: t('studio.footer.privacy') }} />
}
