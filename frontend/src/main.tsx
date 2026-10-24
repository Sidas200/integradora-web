import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Providers } from './app/providers'
import { router } from './app/router'
import { startPwa } from './shared/pwa/registerSW'
import { log } from './shared/lab/logger'
import './shared/styles/tokens.css'
import './shared/styles/global.css'

log('pwa', `Arranque de la app · ${navigator.onLine ? 'en línea' : 'sin conexión'} · ${location.origin}`)
startPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)