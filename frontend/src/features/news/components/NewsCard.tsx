import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import { coverOf } from '../covers'
import type { NewsSummary } from '../queries'
import css from '../news.module.css'


/** Poster card (Flix / EduVerse). The whole card is a link to /news/:slug. */
export function NewsCard({ news }: { news: NewsSummary }) {
  const { t } = useTranslation()
  const cover = coverOf(news.slug, news.coverKey)
  return (
    <article data-news-slug={news.slug} className={css.card}>
      <div className={css.cover} aria-hidden="true">
        <img src={cover.image.src} srcSet={cover.image.srcSet} sizes="(min-width: 900px) 25vw, 90vw"
             style={{ objectPosition: cover.position }} alt="" loading="lazy" decoding="async" draggable={false} />
      </div>
      <div className={css.body}>
        <time dateTime={news.publishedAt} className={css.date}>{formatLongDate(news.publishedAt)}</time>
        <h3 className={css.title}>
          <Link to={`/news/${news.slug}`} className={css.stretched}>{news.title}</Link>
        </h3>
        <p className={css.summary}>{news.summary}</p>
        <Link to={`/news/${news.slug}`} aria-hidden="true" tabIndex={-1} className={css.more}>
          {t('news.readMore')}<ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  )
}
