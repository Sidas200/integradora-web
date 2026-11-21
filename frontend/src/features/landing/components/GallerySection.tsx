import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SHOTS, type ShotId } from '@/shared/ui/art'
import css from '../landing.module.css'

const ORDER: readonly ShotId[] = ['island', 'cabin', 'combat', 'forge', 'camp', 'sanctuary', 'varn', 'duel']

/**
 * The only place with real screenshots of the demo: an even 4×2 grid on one dark panel (same size,
 * same frame, a number and caption over each), and a viewer (native <dialog>) with arrows and Esc to close.
 */
export function GallerySection() {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open !== null && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')   // browsers (and test DOMs) without showModal
    }
    if (open === null && d.open) d.close()
  }, [open])

  // Arrow keys move between screenshots while the viewer is open (Esc is handled by <dialog>)
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % ORDER.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + ORDER.length) % ORDER.length))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const step = (delta: number) => setOpen((i) => (i === null ? i : (i + delta + ORDER.length) % ORDER.length))
  const current = open === null ? null : ORDER[open]!

  return (
    <section id="gallery" aria-labelledby="gallery-title" data-section="gallery" className={css.section}>
      <div className={css.inner}>
        <div className={`${css.center} ${css.reveal}`}>
          <p className={css.eyebrow}>{t('landing.gallery.eyebrow')}</p>
          <h2 id="gallery-title" className={css.h2}>{t('landing.gallery.title')}</h2>
        </div>
        <ul className={css.gallery}>
          {ORDER.map((id, i) => {
            const caption = t(`landing.gallery.shots.${id}`)
            return (
              <li key={id} data-shot={id} className={css.reveal}>
                <button type="button" onClick={() => setOpen(i)} aria-label={t('landing.gallery.open', { caption })}>
                  <img src={SHOTS[id].src} srcSet={SHOTS[id].srcSet} sizes="(min-width: 900px) 25vw, 50vw"
                       alt="" loading="lazy" decoding="async" draggable={false} />
                  <span className={css.galleryCaption} aria-hidden="true"><b>{String(i + 1).padStart(2, '0')}</b><span>{caption}</span></span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <dialog ref={dialog} className={css.viewer} aria-label={t('landing.gallery.title')}
              onClose={() => setOpen(null)}>
        {current && (
          <figure>
            <img src={SHOTS[current].src} alt={t(`landing.gallery.shots.${current}`)} />
            <figcaption>{t(`landing.gallery.shots.${current}`)} <span>{open! + 1} / {ORDER.length}</span></figcaption>
          </figure>
        )}
        <button type="button" className={css.viewerClose} onClick={() => setOpen(null)} aria-label={t('landing.gallery.close')}><X size={20} aria-hidden="true" /></button>
        <button type="button" className={`${css.viewerNav} ${css.viewerPrev}`} onClick={() => step(-1)} aria-label={t('landing.gallery.prev')}><ChevronLeft size={24} aria-hidden="true" /></button>
        <button type="button" className={`${css.viewerNav} ${css.viewerNext}`} onClick={() => step(1)} aria-label={t('landing.gallery.next')}><ChevronRight size={24} aria-hidden="true" /></button>
      </dialog>
    </section>
  )
}
