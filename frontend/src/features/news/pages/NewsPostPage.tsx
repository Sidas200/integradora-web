import { useQuery } from '@tanstack/react-query'
import Markdown from 'react-markdown'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { PageHeader } from '@/shared/ui/PageHeader'
import { formatLongDate } from '@/shared/ui/formatDate'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { newsPostQuery } from '../queries'
import { coverOf } from '../covers'
import css from '../news.module.css'

export function NewsPostPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const q = useQuery(newsPostQuery(slug))

  const backLink = <Link to="/news">{t('news.backToList')}</Link>

  if (q.isPending) return <div className="container-narrow"><Skeleton rows={6} /></div>

  if (q.isError) {
    const { code } = toApiError(q.error)
    // A slug outside the contract pattern (400) is also "this post does not exist" for the reader.
    if (code === 'NOT_FOUND' || code === 'VALIDATION_FAILED') {
      return (
        <section className="container-narrow">
          <PageHeader title={t('news.notFound.title')} />
          <EmptyState title={t('news.notFound.title')} text={t('news.notFound.text')} action={backLink} />
        </section>
      )
    }
    return <div className="container-narrow"><ErrorState error={q.error} onRetry={() => void q.refetch()} /></div>
  }

  const post = q.data
  const cover = coverOf(post.slug, post.coverKey)
  return (
    <article className="container-narrow">
      <div className={css.hero} aria-hidden="true">
        <img src={cover.image.src} srcSet={cover.image.srcSet} sizes="(min-width: 900px) 760px, 100vw"
             style={{ objectPosition: cover.position }} alt="" decoding="async" draggable={false} />
      </div>
      <PageHeader title={post.title} eyebrow={t('nav.news')}>
        <p>
          <time dateTime={post.publishedAt}>{t('news.publishedOn', { date: formatLongDate(post.publishedAt) })}</time>
        </p>
        <p>{post.summary}</p>
      </PageHeader>
      {/* The contract says contentMd has no raw HTML; skipHtml drops it anyway. */}
      <div className={`${css.prose} glass`}>
        <Markdown skipHtml>{post.contentMd}</Markdown>
      </div>
      <footer className={css.back}>{backLink}</footer>
    </article>
  )
}