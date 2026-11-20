import { useQuery } from '@tanstack/react-query'
import { Gamepad2, Monitor, MonitorSmartphone, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useReadOnly } from '@/shared/auth'
import { Button } from '@/shared/ui/Button'
import { formatLongDate } from '@/shared/ui/formatDate'
import { ErrorState, Skeleton } from '@/shared/ui/states'
import { useRevokeDevices } from '../mutations'
import { devicesQuery } from '../queries'
import css from '../account.module.css'

const ICONS = { WEB: Monitor, UNITY_PC: Gamepad2, MOBILE: Smartphone } as const

/**
 * Logins still active (web, game, mobile app). This device has no "close" button: for that there is
 * the general logout, which also clears the cookie of this browser.
 */
export function DevicesSection() {
  const { t } = useTranslation()
  const q = useQuery(devicesQuery())
  const revoke = useRevokeDevices()
  const readOnly = useReadOnly()
  const others = q.data?.filter((d) => !d.current) ?? []

  return (
    <section aria-labelledby="devices-title" className={css.panel}>
      <h2 id="devices-title" className={css.panelTitle}><span className={css.panelIcon} aria-hidden="true"><MonitorSmartphone size={18} /></span>{t('account.security.devicesTitle')}</h2>
      <p className={css.hint}>{t('account.security.devicesIntro')}</p>
      {q.isPending && <Skeleton rows={2} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && (
        <>
          <ul data-list="devices" className={css.devices}>
            {q.data.map((device) => {
              const Icon = ICONS[device.client] ?? Monitor
              return (
              <li key={device.id} data-device-id={device.id} data-current={device.current}>
                <span className={css.deviceIcon} aria-hidden="true"><Icon size={20} /></span>
                <div className={css.deviceText}>
                <p>
                  <strong>{device.description}</strong>{' · '}{t(`account.security.clients.${device.client}`)}
                  {device.current && <> {' · '}<em className={css.current}>{t('account.security.current')}</em></>}
                </p>
                <p>{t('account.security.since', { date: formatLongDate(device.createdAt) })}</p>
                {device.lastUsedAt && <p>{t('account.security.lastUsed', { date: formatLongDate(device.lastUsedAt) })}</p>}
                </div>
                {!device.current && (
                  <Button
                    variant="outline"
                    size="s"
                    loading={revoke.isPending && revoke.variables === device.id}
                    disabled={readOnly}
                    onClick={() => revoke.mutate(device.id)}
                    aria-label={`${t('account.security.revoke')}: ${device.description}`}
                  >
                    {t('account.security.revoke')}
                  </Button>
                )}
              </li>
              )
            })}
          </ul>
          {others.length === 0 ? (
            <p className={css.hint}>{t('account.security.noOthers')}</p>
          ) : (
            <Button variant="danger" loading={revoke.isPending && revoke.variables === undefined}
                    disabled={readOnly} onClick={() => revoke.mutate(undefined)}>
              {t('account.security.revokeOthers')}
            </Button>
          )}
          {revoke.isError && <ErrorState error={revoke.error} />}
        </>
      )}
    </section>
  )
}