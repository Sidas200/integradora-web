import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'
import { log } from '@/shared/lab/logger'

export type SubscriptionRequest = components['schemas']['SubscriptionRequest']

/** SENT: the API answered 202. QUEUED: no network, the Service Worker kept it for Background Sync. */
export type SubscribeOutcome = 'SENT' | 'QUEUED'

export function useSubscribe() {
  return useMutation({
    // 'always': without network the request must still reach the Service Worker so it can queue it.
    networkMode: 'always',
    mutationFn: async (body: SubscriptionRequest): Promise<SubscribeOutcome> => {
      log('api', 'Payload del formulario de aviso', body)
      try {
        const { response, error } = await api.POST('/subscriptions', { body })
        if (response.headers.get('X-Queued') === '1') return 'QUEUED'
        if (response.status === 202) return 'SENT'
        throw toApiError(error, response.status)
      } catch (error) {
        throw toApiError(error)
      }
    },
  })
}