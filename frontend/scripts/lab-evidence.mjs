// =====================================================================
// Laboratorio de pruebas · recorrido automático (npm run lab:evidence)
//
// 1. API      Casos de la API contra Spring Boot + PostgreSQL, serie de latencia y métricas de Actuator.
// 2. PWA      Recorrido con Playwright por las páginas reales (/, /news, /news/:slug) en línea y sin conexión.
// 3. Backend  Recorta del log de Spring Boot las líneas de esta corrida y arma la tabla por petición.
//
// Requisitos: API corriendo (perfil local) y la PWA compilada con `npm run build` + `npm run preview`.
// Lee API_ORIGIN de frontend/.env.local (el mismo que usa Vite). Variables opcionales:
//   LAB_URL (PWA, por defecto http://localhost:4173), BACKEND_LOG, HEADED=1, CHROMIUM_PATH, CDP_PORT.
// Todo se escribe en docs/testing/evidencias/.
// =====================================================================
import { chromium } from 'playwright'
import { loadEnv } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = loadEnv('production', FRONTEND, '')
const API = (env.API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '')
const BASE = (env.LAB_URL || 'http://localhost:4173').replace(/\/$/, '')
const OUT = path.resolve(FRONTEND, '../docs/testing/evidencias')
const BACKEND_LOG = env.BACKEND_LOG || path.resolve(FRONTEND, '../backend/logs/tdimp-api.log')
const CDP_PORT = Number(env.CDP_PORT || 9333)
const SYNC_TAG = 'workbox-background-sync:subscription-queue'

const runStart = new Date()
const stamp = runStart.toISOString().replace(/\D/g, '').slice(0, 14)
const EMAIL_API = `lab-api-${stamp}@tdimp.test`
const EMAIL_ONLINE = `lab-online-${stamp}@tdimp.test`
const EMAIL_OFFLINE = `lab-offline-${stamp}@tdimp.test`
const EXPECTED = { published: 12, pageSize: 6, achievements: 6 }

for (const dir of ['db', 'backend', 'frontend']) await mkdir(path.join(OUT, dir), { recursive: true })

const md = (v) => String(v ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ')
const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : n.toFixed(1))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const failures = []

// ---------------------------------------------------------------------------------------------
// 0. Comprobaciones previas
// ---------------------------------------------------------------------------------------------
async function reachable(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return r.status < 500
  } catch {
    return false
  }
}
if (!(await reachable(`${API}/actuator/health`))) {
  console.error(`✘ La API no responde en ${API}. Arráncala (cd backend; ./mvnw spring-boot:run) o revisa API_ORIGIN en frontend/.env.local.`)
  process.exit(1)
}
if (!(await reachable(BASE))) {
  console.error(`✘ La PWA no responde en ${BASE}. Corre npm run build y luego npm run preview en otra terminal.`)
  process.exit(1)
}
console.log(`API ${API} · PWA ${BASE} · evidencias en ${OUT}\n`)

// ---------------------------------------------------------------------------------------------
// 1. API
// ---------------------------------------------------------------------------------------------
function parseServerTiming(header) {
  const out = {}
  for (const part of (header ?? '').split(',')) {
    const name = part.trim().split(';')[0]
    const dur = /dur=([\d.]+)/.exec(part)
    if (name && dur) out[name] = Number(dur[1])
  }
  return out
}

async function call(method, route, { json, raw } = {}) {
  const body = raw ?? (json === undefined ? undefined : JSON.stringify(json))
  const started = performance.now()
  const res = await fetch(API + route, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body,
  })
  const text = await res.text()
  const ms = performance.now() - started
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  const h = (name) => res.headers.get(name)
  return {
    status: res.status,
    ms,
    bytes: Buffer.byteLength(text),
    data,
    contentType: h('content-type'),
    cacheControl: h('cache-control'),
    serverTiming: h('server-timing'),
    timing: parseServerTiming(h('server-timing')),
    requestId: h('x-request-id'),
  }
}

const expect = (cond, message) => {
  if (!cond) throw new Error(message)
}
const isProblem = (r, code) =>
  r.contentType?.startsWith('application/problem+json') && r.data?.code === code

const apiCases = [
  ['API-01', 'GET', '/api/v1/news?page=0&size=6', 'Listado, primera página', 200, {}, (r) => {
    expect(r.data?.content?.length === EXPECTED.pageSize, `content tiene ${r.data?.content?.length} elementos`)
    expect(r.data?.page?.totalElements === EXPECTED.published, `totalElements=${r.data?.page?.totalElements}`)
    expect(r.cacheControl?.includes('max-age=300'), `Cache-Control=${r.cacheControl}`)
    return `${r.data.content.length} de ${r.data.page.totalElements} · ${r.cacheControl}`
  }],
  ['API-02', 'GET', '/api/v1/news?page=1&size=6', 'Listado, segunda página', 200, {}, (r) => {
    expect(r.data?.content?.length === EXPECTED.published - EXPECTED.pageSize, `content tiene ${r.data?.content?.length}`)
    return `página ${r.data.page.number + 1} de ${r.data.page.totalPages}`
  }],
  ['API-03', 'GET', '/api/v1/news/lab-devlog-06-forge', 'Detalle de una noticia publicada', 200, {}, (r) => {
    expect(typeof r.data?.contentMd === 'string' && r.data.contentMd.length > 0, 'sin contentMd')
    return `"${r.data.title}" · ${r.data.contentMd.length} caracteres de Markdown`
  }],
  ['API-04', 'GET', '/api/v1/news/lab-draft-not-visible', 'Un borrador no se publica', 404, {}, (r) => {
    expect(isProblem(r, 'NOT_FOUND'), `respuesta ${r.contentType} ${r.data?.code}`)
    return 'problem+json NOT_FOUND'
  }],
  ['API-05', 'GET', '/api/v1/news?size=51', 'Tamaño de página fuera de rango', 400, {}, (r) => {
    expect(isProblem(r, 'VALIDATION_FAILED'), `code=${r.data?.code}`)
    return `VALIDATION_FAILED · campo ${r.data.errors?.[0]?.field}`
  }],
  ['API-06', 'GET', '/api/v1/achievements', 'Catálogo de logros', 200, {}, (r) => {
    expect(Array.isArray(r.data) && r.data.length === EXPECTED.achievements, `${r.data?.length} logros`)
    const hidden = r.data.filter((a) => a.hidden)
    expect(hidden.length > 0 && hidden.every((a) => a.description === null), 'el logro oculto trae descripción')
    expect(r.cacheControl?.includes('max-age=3600'), `Cache-Control=${r.cacheControl}`)
    return `${r.data.length} logros, ${hidden.length} oculto(s) sin descripción · ${r.cacheControl}`
  }],
  ['API-07', 'POST', '/api/v1/subscriptions', 'Registro válido', 202,
    { json: { email: EMAIL_API, language: 'es', consent: true } }, () => EMAIL_API],
  ['API-08', 'POST', '/api/v1/subscriptions', 'Mismo correo en mayúsculas (idempotente)', 202,
    { json: { email: EMAIL_API.toUpperCase(), language: 'es', consent: true } },
    () => 'sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING'],
  ['API-09', 'POST', '/api/v1/subscriptions', 'Correo inválido', 400,
    { json: { email: 'no-es-correo', language: 'es', consent: true } }, (r) => {
      expect(isProblem(r, 'VALIDATION_FAILED') && r.data.errors?.[0]?.field === 'email', JSON.stringify(r.data?.errors))
      return 'VALIDATION_FAILED · campo email'
    }],
  ['API-10', 'POST', '/api/v1/subscriptions', 'Sin consentimiento', 400,
    { json: { email: `lab-noconsent-${stamp}@tdimp.test`, language: 'es', consent: false } }, (r) => {
      expect(isProblem(r, 'VALIDATION_FAILED'), `code=${r.data?.code}`)
      return `VALIDATION_FAILED · campo ${r.data.errors?.[0]?.field}`
    }],
  ['API-11', 'POST', '/api/v1/subscriptions', 'Idioma no soportado', 400,
    { json: { email: `lab-fr-${stamp}@tdimp.test`, language: 'fr', consent: true } }, (r) => {
      expect(isProblem(r, 'VALIDATION_FAILED'), `code=${r.data?.code}`)
      return `VALIDATION_FAILED · campo ${r.data.errors?.[0]?.field}`
    }],
  ['API-12', 'POST', '/api/v1/subscriptions', 'JSON mal formado', 400, { raw: '{"email":' }, (r) => {
    expect(isProblem(r, 'VALIDATION_FAILED'), `code=${r.data?.code}`)
    return 'VALIDATION_FAILED · cuerpo ilegible'
  }],
]

console.log('1. API')
const apiResults = []
for (const [id, method, route, title, expectedStatus, options, check] of apiCases) {
  const r = await call(method, route, options)
  let ok = r.status === expectedStatus
  let detail = ok ? '' : `status ${r.status}, se esperaba ${expectedStatus}`
  if (ok) {
    try {
      detail = check(r) ?? ''
    } catch (error) {
      ok = false
      detail = error.message
    }
  }
  if (!ok) failures.push(`${id} ${title}: ${detail}`)
  apiResults.push({ id, method, route, title, expectedStatus, ok, detail, ...r })
  console.log(`  ${ok ? '✔' : '✘'} ${id} ${method} ${route} -> ${r.status} en ${r.ms.toFixed(0)} ms · ${detail}`)
}

// Serie de latencia: 20 peticiones seguidas por endpoint de lectura (sin caché del navegador).
const SERIES = 20
const latencyTargets = ['/api/v1/news?page=0&size=6', '/api/v1/news/lab-devlog-06-forge', '/api/v1/achievements']
const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
const latency = []
for (const route of latencyTargets) {
  const samples = []
  for (let i = 0; i < SERIES; i++) samples.push(await call('GET', route))
  const total = samples.map((s) => s.ms).sort((a, b) => a - b)
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
  latency.push({
    route,
    n: SERIES,
    allOk: samples.every((s) => s.status === 200),
    min: total[0],
    p50: percentile(total, 50),
    p95: percentile(total, 95),
    max: total.at(-1),
    avg: avg(total),
    app: avg(samples.map((s) => s.timing.app ?? 0)),
    db: avg(samples.map((s) => s.timing.db ?? 0)),
    bytes: samples[0].bytes,
  })
}
console.log(`  ✔ serie de latencia: ${SERIES} peticiones × ${latencyTargets.length} endpoints`)

// Métricas de Actuator (el perfil local las expone).
async function metric(name, tag) {
  const r = await call('GET', `/actuator/metrics/${name}${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`)
  if (r.status !== 200) return null
  return Object.fromEntries((r.data?.measurements ?? []).map((m) => [m.statistic, m.value]))
}
const health = await call('GET', '/actuator/health')
const mb = (b) => (b == null ? null : b / 1024 / 1024)
const actuator = {
  health: health.data?.status,
  db: health.data?.components?.db?.status,
  heapUsedMb: mb((await metric('jvm.memory.used', 'area:heap'))?.VALUE),
  heapMaxMb: mb((await metric('jvm.memory.max', 'area:heap'))?.VALUE),
  hikari: {
    active: (await metric('hikaricp.connections.active'))?.VALUE,
    idle: (await metric('hikaricp.connections.idle'))?.VALUE,
    max: (await metric('hikaricp.connections.max'))?.VALUE,
  },
  requests: [],
}
for (const uri of ['/api/v1/news', '/api/v1/news/{slug}', '/api/v1/achievements', '/api/v1/subscriptions']) {
  const m = await metric('http.server.requests', `uri:${uri}`)
  if (m) actuator.requests.push({ uri, count: m.COUNT, avgMs: (m.TOTAL_TIME / m.COUNT) * 1000, maxMs: m.MAX * 1000 })
}
console.log(`  ✔ Actuator: health=${actuator.health}, db=${actuator.db}, heap=${fmt(actuator.heapUsedMb)} MB\n`)

// ---------------------------------------------------------------------------------------------
// 2. PWA con Playwright
// ---------------------------------------------------------------------------------------------
console.log('2. PWA')
const browser = await chromium.launch({
  headless: !env.HEADED,
  executablePath: env.CHROMIUM_PATH || undefined,
  args: [`--remote-debugging-port=${CDP_PORT}`],
})
const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  locale: 'es-MX',
  serviceWorkers: 'allow',
  recordHar: { path: path.join(OUT, 'frontend/network.har'), urlFilter: /\/api\// },
})
const page = await context.newPage()
let currentStep = 'inicio'

const consoleLines = []
const pushConsole = (origin) => (msg) =>
  consoleLines.push(`${new Date().toISOString()} [${origin}] [${msg.type()}] ${msg.text().replace(/%c/g, '')}`)
page.on('console', pushConsole('page'))
context.on('serviceworker', (worker) => worker.on?.('console', pushConsole('sw')))

const network = []
page.on('requestfinished', async (request) => {
  if (!request.url().includes('/api/')) return
  const step = currentStep
  const response = await request.response()
  const timing = request.timing()
  const sizes = await request.sizes().catch(() => null)
  const headers = (await response?.allHeaders()) ?? {}
  network.push({
    step,
    method: request.method(),
    url: request.url().replace(BASE, ''),
    status: response?.status(),
    fromServiceWorker: response?.fromServiceWorker() ?? false,
    ttfbMs: timing.responseStart >= 0 ? Math.round(timing.responseStart - Math.max(timing.requestStart, 0)) : null,
    totalMs: timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : null,
    responseBytes: sizes && sizes.responseBodySize >= 0 ? sizes.responseBodySize : null,
    payload: request.postData() ?? null,
    cacheControl: headers['cache-control'],
    serverTiming: headers['server-timing'],
    queued: headers['x-queued'],
  })
})
page.on('requestfailed', (request) => {
  if (request.url().includes('/api/'))
    network.push({ step: currentStep, method: request.method(), url: request.url().replace(BASE, ''),
      status: `falló: ${request.failure()?.errorText}` })
})

const application = []
async function inspectApplication(label) {
  const snap = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    const cacheStorage = await Promise.all((await caches.keys()).map(async (name) => {
      const keys = await (await caches.open(name)).keys()
      return { name, entries: keys.length, api: keys.map((r) => new URL(r.url)).filter((u) => u.pathname.startsWith('/api/')).map((u) => u.pathname + u.search) }
    }))
    const databases = (await indexedDB.databases()).map((d) => d.name)
    const queue = await new Promise((resolve) => {
      if (!databases.includes('workbox-background-sync')) return resolve([])
      const open = indexedDB.open('workbox-background-sync')
      open.onerror = () => resolve([])
      open.onsuccess = () => {
        const db = open.result
        if (!db.objectStoreNames.contains('requests')) return resolve([])
        const all = db.transaction('requests').objectStore('requests').getAll()
        all.onsuccess = () => {
          resolve(all.result.map((e) => ({
            queueName: e.queueName,
            queuedAt: new Date(e.timestamp).toISOString(),
            method: e.requestData.method,
            url: e.requestData.url,
            payload: e.requestData.body ? new TextDecoder().decode(e.requestData.body) : null,
          })))
          db.close()
        }
      }
    })
    return {
      online: navigator.onLine,
      serviceWorker: { state: reg?.active?.state ?? 'none', scriptURL: reg?.active?.scriptURL, controlsPage: Boolean(navigator.serviceWorker.controller) },
      cacheStorage,
      indexedDB: { databases, backgroundSyncQueue: queue },
    }
  })
  application.push({ step: label, at: new Date().toISOString(), ...snap })
  return snap
}

// context.setOffline() no corta las peticiones que hace el Service Worker: se las hacemos fallar por CDP.
let swSocket = null
let cdpId = 10
async function setOffline(offline) {
  if (offline) {
    await context.setOffline(true)
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const sw = targets.find((t) => t.type === 'service_worker' && t.url.startsWith(BASE))
    if (!sw) throw new Error('no se encontró el Service Worker para cortarle la red')
    swSocket = new WebSocket(sw.webSocketDebuggerUrl)
    await new Promise((ok, fail) => {
      swSocket.onopen = ok
      swSocket.onerror = fail
    })
    swSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.method !== 'Fetch.requestPaused') return
      swSocket.send(JSON.stringify({ id: ++cdpId, method: 'Fetch.failRequest',
        params: { requestId: data.params.requestId, errorReason: 'InternetDisconnected' } }))
    }
    swSocket.send(JSON.stringify({ id: 1, method: 'Fetch.enable', params: { patterns: [{ urlPattern: '*/api/*' }] } }))
    await sleep(300)
  } else {
    swSocket?.send(JSON.stringify({ id: 2, method: 'Fetch.disable' }))
    await sleep(300)
    swSocket?.close()
    swSocket = null
    await context.setOffline(false)
  }
}

const pwaResults = []
async function step(id, title, fn) {
  currentStep = id
  const started = Date.now()
  try {
    const detail = await fn()
    pwaResults.push({ id, title, ok: true, detail, ms: Date.now() - started })
    console.log(`  ✔ ${id} ${title} · ${detail}`)
  } catch (error) {
    const detail = String(error?.message ?? error).split('\n')[0]
    pwaResults.push({ id, title, ok: false, detail, ms: Date.now() - started })
    failures.push(`${id} ${title}: ${detail}`)
    console.log(`  ✘ ${id} ${title} · ${detail}`)
    await page.screenshot({ path: path.join(OUT, `frontend/${id}-ERROR.png`), fullPage: true }).catch(() => {})
  }
}
const shot = (name) => page.screenshot({ path: path.join(OUT, 'frontend', name), fullPage: true })
const newsItems = () => page.getByTestId('news-item')
const swLogged = (text) => consoleLines.some((l) => l.includes('[sw]') && l.includes(text))
let visitedSlug = null
let unvisitedSlug = null

async function fillSubscription(email) {
  await page.locator('#subscribe').scrollIntoViewIfNeeded()
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Acepto el aviso de privacidad').check()
  await page.getByRole('button', { name: 'Avisarme', exact: true }).click()
}

await step('PWA-01', 'Landing: GET de logros y últimas noticias renderizados; Service Worker activo', async () => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  // La primera visita instala el Service Worker; desde la recarga todas las peticiones pasan por él.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 20_000 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('[data-achievement-id]').nth(EXPECTED.achievements - 1).waitFor({ timeout: 15_000 })
  const achievements = await page.locator('[data-achievement-id]').count()
  const latest = await page.locator('[data-list="latest-news"] li').count()
  const hidden = await page.locator('[data-hidden="true"]').count()
  expect(achievements === EXPECTED.achievements, `${achievements} logros en pantalla`)
  expect(hidden > 0, 'no se muestra ningún logro oculto')
  expect(latest === 3, `${latest} noticias recientes`)
  await shot('ui-01-landing.png')
  return `${achievements} logros (${hidden} ocultos, sin descripción) y ${latest} noticias recientes`
})

await step('PWA-02', 'Noticias: listado paginado con "Cargar más"', async () => {
  await page.goto(BASE + '/news', { waitUntil: 'networkidle' })
  await newsItems().first().waitFor({ timeout: 15_000 })
  const first = await newsItems().count()
  expect(first === EXPECTED.pageSize, `primera página con ${first}`)
  await page.getByRole('button', { name: 'Cargar más' }).click()
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="news-item"]').length >= n,
    EXPECTED.published, { timeout: 15_000 })
  await sleep(500) // Workbox escribe la copia en Cache Storage en segundo plano
  await shot('ui-02-noticias.png')
  const slugs = await page.locator('[data-news-slug]').evaluateAll((els) => els.map((e) => e.dataset.newsSlug))
  visitedSlug = slugs[0]
  unvisitedSlug = slugs.at(-1)
  const snap = await inspectApplication('PWA-02 en línea, tras consultar')
  const api = snap.cacheStorage.find((c) => c.name === 'public-api')
  return `${first} → ${slugs.length} noticias · public-api con ${api?.entries ?? 0} respuestas`
})

await step('PWA-03', 'Detalle: GET /news/{slug} renderiza el Markdown', async () => {
  await newsItems().first().getByRole('heading').getByRole('link').click()
  await page.getByRole('link', { name: 'Volver a noticias' }).waitFor({ timeout: 15_000 })
  const title = await page.locator('h1').innerText()
  await sleep(300)
  await shot('ui-03-detalle.png')
  return `/news/${visitedSlug} · "${title}"`
})

await step('PWA-04', 'Formulario en línea: POST /subscriptions responde 202', async () => {
  await page.goto(BASE + '/#subscribe', { waitUntil: 'networkidle' })
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/v1/subscriptions') && r.request().method() === 'POST'),
    fillSubscription(EMAIL_ONLINE),
  ])
  await page.getByText('¡Listo! Te avisaremos').waitFor({ timeout: 10_000 })
  await shot('ui-04-registro-en-linea.png')
  expect(response.status() === 202, `status ${response.status()}`)
  return `${EMAIL_ONLINE} → ${response.status()}`
})

await step('PWA-05', 'Sin conexión: listado y detalle visitados salen de Cache Storage', async () => {
  await setOffline(true)
  await page.goto(BASE + '/news', { waitUntil: 'domcontentloaded' })
  await newsItems().first().waitFor({ timeout: 15_000 })
  await page.getByText('Sin conexión.').first().waitFor()
  await shot('ui-05-offline-noticias.png')
  await page.goto(`${BASE}/news/${visitedSlug}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: 'Volver a noticias' }).waitFor({ timeout: 15_000 })
  await shot('ui-06-offline-detalle.png')
  expect(swLogged('la red falló, se usa la copia guardada'), 'el Service Worker no reportó la copia en caché')
  return `${await page.locator('h1').innerText()} · servido por el SW desde public-api`
})

await step('PWA-06', 'Sin conexión: una noticia nunca visitada muestra error y "Reintentar"', async () => {
  await page.goto(`${BASE}/news/${unvisitedSlug}`, { waitUntil: 'domcontentloaded' })
  await page.getByText('No hay conexión con el servidor').waitFor({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Reintentar' }).waitFor()
  await shot('ui-07-offline-sin-copia.png')
  return `/news/${unvisitedSlug} · estado de error controlado (NETWORK_ERROR)`
})

await step('PWA-07', 'Sin conexión: el POST se guarda en IndexedDB (Background Sync)', async () => {
  await page.goto(BASE + '/#subscribe', { waitUntil: 'domcontentloaded' })
  await fillSubscription(EMAIL_OFFLINE)
  await page.getByText('Sin conexión: guardamos tu registro').waitFor({ timeout: 10_000 })
  await shot('ui-08-offline-en-cola.png')
  const snap = await inspectApplication('PWA-07 sin conexión, tras el envío')
  const queued = snap.indexedDB.backgroundSyncQueue
  expect(queued.length === 1, `${queued.length} peticiones en la cola`)
  return `1 petición en ${queued[0].queueName}: ${queued[0].payload}`
})

await step('PWA-08', 'Vuelve la red: la cola se envía, queda vacía y la PWA lo avisa', async () => {
  await setOffline(false)
  // Chrome dispara el evento sync por su cuenta; aquí se fuerza para no esperar.
  const cdp = await context.newCDPSession(page)
  const registrations = new Map()
  cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations: list }) =>
    list.forEach((r) => registrations.set(r.scopeURL, r.registrationId)))
  await cdp.send('ServiceWorker.enable')
  await sleep(800)
  const registrationId = registrations.get(BASE + '/')
  if (registrationId)
    await cdp.send('ServiceWorker.dispatchSyncEvent', { origin: BASE, registrationId, tag: SYNC_TAG, lastChance: false }).catch(() => {})
  await page.getByText('Volvió la conexión').waitFor({ timeout: 20_000 })
  await shot('ui-09-sincronizado.png')
  const snap = await inspectApplication('PWA-08 en línea, tras sincronizar')
  expect(snap.indexedDB.backgroundSyncQueue.length === 0, 'la cola no se vació')
  expect(swLogged('sync: reenviado'), 'el Service Worker no reportó el reenvío')
  return `cola vacía · ${EMAIL_OFFLINE} reenviado`
})

const chromiumVersion = browser.version()
await context.close() // aquí se escribe network.har
await browser.close()

// ---------------------------------------------------------------------------------------------
// 3. Log del backend: solo las líneas de esta corrida
// ---------------------------------------------------------------------------------------------
console.log('\n3. Backend')
const TS = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))/
const NOISE = /HikariPool-1:housekeeper|Fill pool skipped|keepalive: connection/
const OUTGOING = /\[req=(\w+)\].*<-- (\w+) (\S+) -> (\d{3}) en ([\d.]+) ms \(BD: (\d+) consultas, ([\d.]+) ms\) \| respuesta=(\d+) B \| heap ([\d.]+) -> ([\d.]+) MB/
let backendLines = []
let traces = []
try {
  let keep = false
  for (const line of (await readFile(BACKEND_LOG, 'utf8')).split(/\r?\n/)) {
    const ts = TS.exec(line)
    if (ts) keep = Date.parse(ts[1]) >= runStart.getTime() - 1000 && !NOISE.test(line)
    if (keep && line) backendLines.push(line)
  }
  traces = backendLines.map((l) => OUTGOING.exec(l)).filter(Boolean).map((m) => ({
    req: m[1], method: m[2], target: m[3], status: m[4], ms: m[5], queries: m[6], dbMs: m[7], bytes: m[8], heapBefore: m[9], heapAfter: m[10],
  }))
  await writeFile(path.join(OUT, 'backend/tdimp-api.log'), backendLines.join('\n') + '\n')
  console.log(`  ✔ ${backendLines.length} líneas del log, ${traces.length} peticiones con traza completa`)
} catch {
  console.log(`  ⚠ no se encontró ${BACKEND_LOG}: copia el log a mano a evidencias/backend/tdimp-api.log`)
}

// ---------------------------------------------------------------------------------------------
// 4. Reportes
// ---------------------------------------------------------------------------------------------
const apiReport = [
  `# Pruebas de la API (${runStart.toISOString()})`, '',
  `API: \`${API}\` · cada fila es una petición directa a Spring Boot (sin navegador ni Service Worker).`, '',
  '| Caso | Petición | Descripción | Esperado | Status | Tiempo (ms) | Bytes | Content-Type | Cache-Control | Server-Timing | X-Request-Id | Resultado |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...apiResults.map((r) => `| ${r.id} | \`${r.method} ${r.route}\` | ${md(r.title)} | ${r.expectedStatus} | ${r.status} | ${r.ms.toFixed(0)} | ${r.bytes} | ${md(r.contentType)} | ${md(r.cacheControl)} | ${md(r.serverTiming)} | ${md(r.requestId)} | ${r.ok ? '✔' : '✘'} ${md(r.detail)} |`),
  '', `## Latencia (${SERIES} peticiones seguidas por endpoint)`, '',
  'Tiempo total medido desde el cliente; `app` y `db` salen del header `Server-Timing` (promedio).', '',
  '| Endpoint | n | mín | p50 | p95 | máx | promedio | app (Spring) | db (PostgreSQL) | Bytes | Todos 200 |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...latency.map((l) => `| \`${l.route}\` | ${l.n} | ${fmt(l.min)} | ${fmt(l.p50)} | ${fmt(l.p95)} | ${fmt(l.max)} | ${fmt(l.avg)} | ${fmt(l.app)} | ${fmt(l.db)} | ${l.bytes} | ${l.allOk ? '✔' : '✘'} |`),
  '', '## Actuator al terminar', '',
  `- Salud: **${actuator.health}** · base de datos: **${actuator.db}**`,
  `- Heap usado: ${fmt(actuator.heapUsedMb)} MB de ${fmt(actuator.heapMaxMb)} MB`,
  `- Pool HikariCP: ${actuator.hikari.active ?? '—'} activas, ${actuator.hikari.idle ?? '—'} libres, máximo ${actuator.hikari.max ?? '—'}`, '',
  '| URI | Peticiones atendidas | Promedio (ms) | Máximo (ms) |', '|---|---|---|---|',
  ...actuator.requests.map((r) => `| \`${r.uri}\` | ${r.count} | ${fmt(r.avgMs)} | ${fmt(r.maxMs)} |`),
].join('\n')

const traceReport = [
  `# Trazas de Spring Boot por petición (${runStart.toISOString()})`, '',
  `Extraídas de \`tdimp-api.log\` (línea \`<--\` de RequestTraceFilter). Heap = memoria usada de la JVM antes y después de atender la petición.`, '',
  '| req | Método | Ruta | Status | Total (ms) | Consultas BD | Tiempo BD (ms) | Respuesta (B) | Heap antes → después (MB) |',
  '|---|---|---|---|---|---|---|---|---|',
  ...traces.map((t) => `| ${t.req} | ${t.method} | \`${md(t.target)}\` | ${t.status} | ${t.ms} | ${t.queries} | ${t.dbMs} | ${t.bytes} | ${t.heapBefore} → ${t.heapAfter} |`),
].join('\n')

const networkReport = [
  `# Tráfico /api de la PWA (${runStart.toISOString()})`, '',
  `Origen: ${BASE} · Chromium ${chromiumVersion}. "Desde SW" = respuesta entregada por el Service Worker a la página.`, '',
  '| Paso | Método | URL | Status | Desde SW | TTFB (ms) | Total (ms) | Respuesta (B) | Payload | Cache-Control | Server-Timing | X-Queued |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...network.map((n) => `| ${n.step} | ${n.method} | \`${md(n.url)}\` | ${md(n.status)} | ${n.fromServiceWorker ? 'sí' : 'no'} | ${md(n.ttfbMs)} | ${md(n.totalMs)} | ${md(n.responseBytes)} | ${md(n.payload)} | ${md(n.cacheControl)} | ${md(n.serverTiming)} | ${md(n.queued)} |`),
].join('\n')

const passed = (list) => `${list.filter((r) => r.ok).length}/${list.length}`
const summary = [
  '# Resumen del recorrido automático', '',
  `- Fecha: ${runStart.toISOString()}`,
  `- API: \`${API}\` · PWA: \`${BASE}\` · Chromium ${chromiumVersion} · Node ${process.version}`,
  `- API: **${passed(apiResults)}** casos · PWA: **${passed(pwaResults)}** casos`, '',
  '## API', '', '| Caso | Descripción | Resultado | Detalle |', '|---|---|---|---|',
  ...apiResults.map((r) => `| ${r.id} | \`${r.method} ${r.route}\` ${md(r.title)} | ${r.ok ? 'PASA' : 'FALLA'} | ${md(r.detail)} |`),
  '', '## PWA', '', '| Caso | Descripción | Resultado | Detalle | Duración |', '|---|---|---|---|---|',
  ...pwaResults.map((r) => `| ${r.id} | ${md(r.title)} | ${r.ok ? 'PASA' : 'FALLA'} | ${md(r.detail)} | ${r.ms} ms |`),
  '', '## Correos de esta corrida (bloque B de `03_evidencias.sql`)', '',
  `- \`${EMAIL_API}\` (API-07; API-08 lo reenvió en mayúsculas: debe existir una sola fila)`,
  `- \`${EMAIL_ONLINE}\` (PWA-04, en línea)`,
  `- \`${EMAIL_OFFLINE}\` (PWA-07/08, encolado sin conexión y reenviado)`,
  '', '## Archivos generados', '',
  '- `backend/api-report.md`, `backend/trazas.md`, `backend/tdimp-api.log`',
  '- `frontend/ui-01` a `ui-09`, `frontend/network.har`, `frontend/network-report.md`, `frontend/application-report.json`, `frontend/console.log`',
].join('\n')

await writeFile(path.join(OUT, 'backend/api-report.md'), apiReport + '\n')
await writeFile(path.join(OUT, 'backend/trazas.md'), traceReport + '\n')
await writeFile(path.join(OUT, 'frontend/network-report.md'), networkReport + '\n')
await writeFile(path.join(OUT, 'frontend/application-report.json'), JSON.stringify(application, null, 2))
await writeFile(path.join(OUT, 'frontend/console.log'), consoleLines.join('\n') + '\n')
await writeFile(path.join(OUT, 'resumen.md'), summary + '\n')

console.log(`\nAPI ${passed(apiResults)} · PWA ${passed(pwaResults)} · evidencias en ${OUT}`)
if (failures.length) {
  console.log('\nFallas:')
  failures.forEach((f) => console.log(`  ✘ ${f}`))
  process.exit(1)
}