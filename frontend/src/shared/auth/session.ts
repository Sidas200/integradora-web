import { createContext, useContext } from 'react'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export interface SessionPlayer {
  id: string
  username: string
}

/** What the rest of the app may know about the session. Phase 3 adds login/logout. */
export interface Session {
  status: SessionStatus
  player: SessionPlayer | null
}

const ANONYMOUS: Session = { status: 'anonymous', player: null }

/** Until the AuthProvider exists (phase 3) everybody is anonymous. */
export const SessionContext = createContext<Session>(ANONYMOUS)

export function useSession(): Session {
  return useContext(SessionContext)
}