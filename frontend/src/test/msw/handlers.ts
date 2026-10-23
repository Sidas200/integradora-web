import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import { accountFixture, achievementFixtures, newsFixtures, toSummary, tokenFixture } from './fixtures'

type Problem = components['schemas']['Problem']

export const url = (path: string) => `${API_BASE_URL}${path}`

export const problem = (status: number, code: Problem['code'], extra: Partial<Problem> = {}) =>
  HttpResponse.json<Problem>(
    { type: `https://tdimp.app/problems/${code.toLowerCase().replace(/_/g, '-')}`, title: code, status, code, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

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
]