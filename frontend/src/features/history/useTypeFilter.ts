import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { isHistoryType, type HistoryType } from './queries'

/**
 * The history filter lives in ?type= so it survives a reload, can be shared as a link and
 * the browser's back button undoes it. An unknown value is ignored (shows everything).
 */
export function useTypeFilter(): [HistoryType | undefined, (type: HistoryType | undefined) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('type')
  const type = isHistoryType(raw) ? raw : undefined

  const setType = useCallback(
    (next: HistoryType | undefined) =>
      setParams((current) => {
        const updated = new URLSearchParams(current)
        if (next) updated.set('type', next)
        else updated.delete('type')
        return updated
      }),
    [setParams],
  )

  return [type, setType]
}