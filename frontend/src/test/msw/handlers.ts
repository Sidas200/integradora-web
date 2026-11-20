import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import {
  accountFixture, achievementFixtures, devicesFixture, historyFixtures, myAchievementFixtures, newsFixtures,
  saveDetailFixtures, savesFixture, sessionFixtures, settingsFixture, toSummary, tokenFixture,
} from './fixtures'

type Problem = components['schemas']['Problem']

export const url = (path: string) => `${API_BASE_URL}${path}`

export const problem = (status: number, code: Problem['code'], extra: Partial<Problem> = {}) =>
  HttpResponse.json<Problem>(
    { type: `https://tdimp.app/problems/${code.toLowerCase().replace(/_/g, '-')}`, title: code, status, code, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

/** Spring's PageResult: `content` plus `page`, for any list of fixtures. */
export const paged = <T>(items: T[], request: Request, defaultSize = 20) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 0)
  const size = Number(params.get('size') ?? defaultSize)
  return HttpResponse.json({
    content: items.slice(page * size, page * size + size),
    page: { number: page, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) },
  })
}

/** Private endpoints answer 401 without the access token, like BearerAuthInterceptor. */
const authed = (reply: (request: Request, params: Record<string, string | readonly string[] | undefined>) => Response) =>
  ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) =>
    request.headers.get('Authorization')?.startsWith('Bearer ') ? reply(request, params) : problem(401, 'TOKEN_EXPIRED')

/** Default happy-path API. Each test can override one handler with server.use(...). */
export const handlers = [
  http.get(url('/news'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    const size = Number(params.get('size') ?? 20)
    const content = newsFixtures.slice(page * size, page * size + size).map(toSummary)
    return HttpResponse.json({
      content,
      page: { number: page, size, totalElements: newsFixtures.length, totalPages: Math.ceil(newsFixtures.length / size) },
    })
  }),

  http.get(url('/news/:slug'), ({ params }) => {
    const post = newsFixtures.find((n) => n.slug === params.slug)
    return post ? HttpResponse.json(post) : problem(404, 'NOT_FOUND')
  }),

  http.get(url('/achievements'), () => HttpResponse.json(achievementFixtures)),

  http.post(url('/subscriptions'), () => new HttpResponse(null, { status: 202 })),

  // Auth like the backend in dev: by default there is no session cookie, so refresh answers 401.
  http.post(url('/auth/refresh'), () => problem(401, 'INVALID_SESSION')),
  http.post(url('/auth/login'), () => HttpResponse.json(tokenFixture())),
  http.post(url('/auth/register'), () => HttpResponse.json(tokenFixture(), { status: 201 })),
  http.post(url('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
  http.get(url('/account'), ({ request }) =>
    request.headers.get('Authorization')?.startsWith('Bearer ')
      ? HttpResponse.json(accountFixture)
      : problem(401, 'TOKEN_EXPIRED')),

  // Account (phase 4)
  http.post(url('/auth/reauthenticate'), () => HttpResponse.json(tokenFixture('access-reauth'))),
  http.patch(url('/account'), async ({ request }) => {
    const { username } = (await request.json()) as { username: string }
    return HttpResponse.json({ ...accountFixture, username })
  }),
  http.delete(url('/account'), () => new HttpResponse(null, { status: 204 })),
  http.put(url('/account/password'), () => new HttpResponse(null, { status: 204 })),
  http.get(url('/account/settings'), () => HttpResponse.json(settingsFixture)),
  http.put(url('/account/settings'), async ({ request }) =>
    HttpResponse.json({ ...((await request.json()) as object), updatedAt: '2026-10-23T05:00:00Z' })),
  http.get(url('/account/devices'), () => HttpResponse.json(devicesFixture)),
  http.delete(url('/account/devices'), () => new HttpResponse(null, { status: 204 })),
  http.delete(url('/account/devices/:id'), () => new HttpResponse(null, { status: 204 })),

  // Player data (phase 3)
  http.get(url('/account/saves'), authed(() => HttpResponse.json(savesFixture))),
  http.get(url('/account/saves/:slot'), authed((_, params) => {
    const slot = Number(params.slot)
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) return problem(400, 'VALIDATION_FAILED')
    const save = saveDetailFixtures[slot]
    return save ? HttpResponse.json(save) : problem(404, 'NOT_FOUND')
  })),
  http.get(url('/account/sessions'), authed((request) => {
    const slot = new URL(request.url).searchParams.get('slot')
    return paged(slot ? sessionFixtures.filter((s) => s.slot === Number(slot)) : sessionFixtures, request)
  })),
  http.get(url('/account/history'), authed((request) => {
    const type = new URL(request.url).searchParams.get('type')
    return paged(type ? historyFixtures.filter((h) => h.type === type) : historyFixtures, request)
  })),
  http.get(url('/account/achievements'), authed(() => HttpResponse.json(myAchievementFixtures))),
]