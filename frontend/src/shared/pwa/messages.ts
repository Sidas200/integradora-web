export type MessageToSW = { type: 'SKIP_WAITING' }

export type MessageToPage =
  | { type: 'SUBSCRIPTION_QUEUED' }
  | { type: 'SUBSCRIPTION_SENT'; count: number }
