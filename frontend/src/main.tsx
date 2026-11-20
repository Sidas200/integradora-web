import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Providers } from './app/providers'
import { router } from './app/router'
import { listenForInstall } from './shared/pwa/install'
import { startPwa } from './shared/pwa/registerSW'
import { log } from './shared/lab/logger'
import { startTheme } from './shared/theme'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/cinzel'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/600.css'
import './shared/styles/tokens.css'
import './shared/styles/global.css'

log('pwa', `Arranque de la app · ${navigator.onLine ? 'en línea' : 'sin conexión'} · ${location.origin}`)
startTheme()
startPwa()
listenForInstall()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)