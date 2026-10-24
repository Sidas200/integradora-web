import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import type { NewsSummary } from '../queries'

/** One news summary. The whole card is a link to /news/:slug. */
export function NewsCard({ news }: { news: NewsSummary }) {
  const { t } = useTranslation()
  return (
    <article data-news-slug={news.slug}>
      <time dateTime={news.publishedAt}>{formatLongDate(news.publishedAt)}</time>
      <h3>
        <Link to={`/news/${news.slug}`}>{news.title}</Link>
      </h3>
      <p>{news.summary}</p>
      <Link to={`/news/${news.slug}`} aria-hidden="true" tabIndex={-1}>{t('news.readMore')}</Link>
    </article>
  )
}