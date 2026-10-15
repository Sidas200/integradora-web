import { useEffect } from 'react'
import { useNewsList } from '../queries'
import { log, logTable } from '../../../shared/lab/logger'
import css from './NewsList.module.css'

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

export function NewsList() {
  const { data, status, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useNewsList()
  const items = data?.pages.flatMap((p) => p.content) ?? []
  const total = data?.pages[0]?.page.totalElements ?? 0

  useEffect(() => {
    if (status !== 'success') return
    log('render', `NewsList renderizó ${items.length} de ${total} noticias (${data.pages.length} página(s))`)
    logTable('render', 'Noticias en pantalla', items.map((n) => ({ slug: n.slug, title: n.title, publishedAt: n.publishedAt })))
  }, [status, items.length, total, data, items])

  useEffect(() => {
    if (status === 'error') log('error', 'NewsList en estado de error', error)
  }, [status, error])

  return (
    <section aria-labelledby="news-title" className={css.section}>
      <header className={css.header}>
        <h2 id="news-title">Noticias</h2>
        {status === 'success' && (
          <p className={css.meta} aria-live="polite">
            {items.length} de {total} · {isFetching ? 'actualizando…' : 'al día'}
          </p>
        )}
      </header>

      {status === 'pending' && (
        <ul className={css.grid} aria-busy="true" aria-label="Cargando noticias">
          {Array.from({ length: 3 }, (_, i) => <li key={i} className={css.skeleton} />)}
        </ul>
      )}

      {status === 'error' && (
        <div role="alert" className={css.state}>
          <p>No pudimos cargar las noticias.</p>
          <button type="button" onClick={() => void refetch()}>Reintentar</button>
        </div>
      )}

      {status === 'success' && items.length === 0 && (
        <p className={css.state}>Todavía no hay noticias publicadas.</p>
      )}

      {status === 'success' && items.length > 0 && (
        <>
          <ul className={css.grid}>
            {items.map((n) => (
              <li key={n.slug} className={css.card} data-testid="news-item">
                <article>
                  <time dateTime={n.publishedAt}>{dateFormat.format(new Date(n.publishedAt))}</time>
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                </article>
              </li>
            ))}
          </ul>
          {hasNextPage && (
            <button type="button" className={css.more} onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </button>
          )}
        </>
      )}
    </section>
  )
}
