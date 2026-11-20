import { http, HttpResponse } from 'msw'
import { tokenFixture } from './msw/fixtures'
import { url } from './msw/handlers'
import { server } from './msw/server'

/** Opens the app with a valid refresh cookie, so the private routes render instead of /login. */
export function signedIn(accessToken = 'access-1') {
  server.use(http.post(url('/auth/refresh'), () => HttpResponse.json(tokenFixture(accessToken))))
}