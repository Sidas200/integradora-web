import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { formatLongDate } from '@/shared/ui/formatDate'
import { ErrorState, Skeleton } from '@/shared/ui/states'
import { useRevokeDevices } from '../mutations'
import { devicesQuery } from '../queries'

/**
 * Logins still active (web, game, mobile app). This device has no "close" button: for that there is
 * the general logout, which also clears the cookie of this browser.
 */
export function DevicesSection() {
  const { t } = useTranslation()
  const q = useQuery(devicesQuery())
  const revoke = useRevokeDevices()
  const others = q.data?.filter((d) => !d.current) ?? []

  return (
    <section aria-labelledby="devices-title">
      <h2 id="devices-title">{t('account.security.devicesTitle')}</h2>
      <p>{t('account.security.devicesIntro')}</p>
      {q.isPending && <Skeleton rows={2} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && (
        <>
          <ul data-list="devices">
            {q.data.map((device) => (
              <li key={device.id} data-device-id={device.id} data-current={device.current}>
                <p>
                  <strong>{device.description}</strong>{' · '}{t(`account.security.clients.${device.client}`)}
                  {device.current && <> {' · '}<em>{t('account.security.current')}</em></>}
                </p>
                <p>{t('account.security.since', { date: formatLongDate(device.createdAt) })}</p>
                {device.lastUsedAt && <p>{t('account.security.lastUsed', { date: formatLongDate(device.lastUsedAt) })}</p>}
                {!device.current && (
                  <Button
                    variant="outline"
                    loading={revoke.isPending && revoke.variables === device.id}
                    onClick={() => revoke.mutate(device.id)}
                    aria-label={`${t('account.security.revoke')}: ${device.description}`}
                  >
                    {t('account.security.revoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {others.length === 0 ? (
            <p>{t('account.security.noOthers')}</p>
          ) : (
            <Button variant="danger" loading={revoke.isPending && revoke.variables === undefined}
                    onClick={() => revoke.mutate(undefined)}>
              {t('account.security.revokeOthers')}
            </Button>
          )}
          {revoke.isError && <ErrorState error={revoke.error} />}
        </>
      )}
    </section>
  )
}