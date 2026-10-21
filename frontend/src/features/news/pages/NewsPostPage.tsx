import { useQuery } from '@tanstack/react-query'
import Markdown from 'react-markdown'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { PageHeader } from '@/shared/ui/PageHeader'
import { formatLongDate } from '@/shared/ui/formatDate'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { newsPostQuery } from '../queries'

export function NewsPostPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const q = useQuery(newsPostQuery(slug))

  const backLink = <Link to="/news">{t('news.backToList')}</Link>

  if (q.isPending) return <Skeleton rows={6} />

  if (q.isError) {
    const { code } = toApiError(q.error)
    // A slug outside the contract pattern (400) is also "this post does not exist" for the reader.
    if (code === 'NOT_FOUND' || code === 'VALIDATION_FAILED') {
      return (
        <section>
          <PageHeader title={t('news.notFound.title')} />
          <EmptyState title={t('news.notFound.title')} text={t('news.notFound.text')} action={backLink} />
        </section>
      )
    }
    return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  }

  const post = q.data
  return (
    <article>
      <PageHeader title={post.title}>
        <p>
          <time dateTime={post.publishedAt}>{t('news.publishedOn', { date: formatLongDate(post.publishedAt) })}</time>
        </p>
        <p>{post.summary}</p>
      </PageHeader>
      {/* The contract says contentMd has no raw HTML; skipHtml drops it anyway. */}
      <Markdown skipHtml>{post.contentMd}</Markdown>
      <footer>{backLink}</footer>
    </article>
  )
}