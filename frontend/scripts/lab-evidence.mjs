// Recorrido de la PWA con Playwright. Requiere el backend en :8080 y `npm run preview`.
// Uso: npm run lab:evidence   (HEADED=1 para ver el navegador, LAB_URL para otra URL)
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BASE = (process.env.LAB_URL ?? 'http://localhost:4173').replace(/\/$/, '')
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/testing/evidencias/auto')
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const EMAIL_ONLINE = `lab-online-${stamp}@tdimp.test`
const EMAIL_OFFLINE = `lab-offline-${stamp}@tdimp.test`
const SYNC_TAG = 'workbox-background-sync:subscription-queue'

await mkdir(OUT, { recursive: true })
const CDP_PORT = Number(process.env.CDP_PORT ?? 9333)
const browser = await chromium.launch({
  headless: !process.env.HEADED,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: [`--remote-debugging-port=${CDP_PORT}`],
})
const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  locale: 'es-MX',
  serviceWorkers: 'allow',
  recordHar: { path: path.join(OUT, 'network.har'), urlFilter: /\/api\// },
})
const page = await context.newPage()

const consoleLines = []
const pushConsole = (origin) => (msg) =>
  consoleLines.push(`${new Date().toISOString()} [${origin}] [${msg.type()}] ${msg.text().replace(/%c/g, '')}`)
page.on('console', pushConsole('page'))
context.on('serviceworker', (worker) => worker.on?.('console', pushConsole('sw')))

const network = []
page.on('requestfinished', async (request) => {
  if (!request.url().includes('/api/')) return
  const response = await request.response()
  const timing = request.timing()
  const sizes = await request.sizes().catch(() => null)
  const headers = (await response?.allHeaders()) ?? {}
  network.push({
    step: currentStep,
    method: request.method(),
    url: request.url().replace(BASE, ''),
    status: response?.status(),
    fromServiceWorker: response?.fromServiceWorker() ?? false,
    latencyMs: timing.responseStart >= 0 ? Math.round(timing.responseStart - Math.max(timing.requestStart, 0)) : null,
    totalMs: timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : null,
    requestBytes: sizes?.requestBodySize ?? null,
    responseBytes: sizes && sizes.responseBodySize >= 0 ? sizes.responseBodySize : ((await response?.body().catch(() => null))?.length ?? null),
    requestPayload: request.postData() ?? null,
    headers: {
      'content-type': headers['content-type'],
      'cache-control': headers['cache-control'],
      'server-timing': headers['server-timing'],
      'x-request-id': headers['x-request-id'],
      'x-queued': headers['x-queued'],
    },
  })
})
page.on('requestfailed', (request) => {
  if (request.url().includes('/api/'))
    network.push({ step: currentStep, method: request.method(), url: request.url().replace(BASE, ''), status: 'FALLÓ (sin red)', failure: request.failure()?.errorText })
})

const application = []
async function inspectApplication(label) {
  const snap = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    const cacheNames = await caches.keys()
    const cacheStorage = await Promise.all(cacheNames.map(async (name) => {
      const keys = await (await caches.open(name)).keys()
      return { name, entries: keys.length, sample: keys.slice(0, 4).map((r) => new URL(r.url).pathname + new URL(r.url).search) }
    }))
    const databases = (await indexedDB.databases()).map((d) => `${d.name} v${d.version}`)
    const queue = await new Promise((resolve) => {
      if (!databases.some((d) => d.startsWith('workbox-background-sync'))) return resolve([])
      const open = indexedDB.open('workbox-background-sync')
      open.onsuccess = () => {
        const db = open.result
        if (!db.objectStoreNames.contains('requests')) return resolve([])
        const all = db.transaction('requests').objectStore('requests').getAll()
        all.onsuccess = () => resolve(all.result.map((e) => ({
          queueName: e.queueName,
          queuedAt: new Date(e.timestamp).toISOString(),
          method: e.requestData.method,
          url: e.requestData.url,
          payload: e.requestData.body ? new TextDecoder().decode(e.requestData.body) : null,
        })))
      }
      open.onerror = () => resolve([])
    })
    return {
      online: navigator.onLine,
      serviceWorker: { scope: reg?.scope, state: reg?.active?.state ?? 'none', scriptURL: reg?.active?.scriptURL, controlsPage: Boolean(navigator.serviceWorker.controller) },
      cacheStorage,
      indexedDB: { databases, backgroundSyncQueue: queue },
    }
  })
  application.push({ step: label, at: new Date().toISOString(), ...snap })
  return snap
}

let swSocket = null
let cdpId = 10
async function setServiceWorkerOffline(offline) {
  if (offline && !swSocket) {
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const sw = targets.find((t) => t.type === 'service_worker' && t.url.startsWith(BASE))
    if (!sw) throw new Error('no se encontró el target del Service Worker')
    swSocket = new WebSocket(sw.webSocketDebuggerUrl)
    await new Promise((ok, fail) => { swSocket.onopen = ok; swSocket.onerror = fail })
    swSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (process.env.LAB_DEBUG && data.method) console.log('  [cdp]', data.method, data.params?.request?.url ?? '')
      if (process.env.LAB_DEBUG && data.error) console.log('  [cdp] error', JSON.stringify(data.error))
      if (data.method !== 'Fetch.requestPaused') return
      swSocket.send(JSON.stringify({ id: ++cdpId, method: 'Fetch.failRequest',
        params: { requestId: data.params.requestId, errorReason: 'InternetDisconnected' } }))
    }
    swSocket.send(JSON.stringify({ id: 1, method: 'Fetch.enable', params: { patterns: [{ urlPattern: '*/api/*' }] } }))
    await new Promise((r) => setTimeout(r, 300))
  } else if (!offline && swSocket) {
    swSocket.send(JSON.stringify({ id: 2, method: 'Fetch.disable' }))
    await new Promise((r) => setTimeout(r, 300))
    swSocket.close()
    swSocket = null
  }
  if (process.env.LAB_DEBUG) console.log('  [cdp] red del service worker:', offline ? 'cortada' : 'restablecida')
}

let currentStep = 'inicio'
const results = []
async function step(id, title, fn) {
  currentStep = id
  const started = Date.now()
  try {
    const detail = await fn()
    results.push({ id, title, ok: true, detail, ms: Date.now() - started })
    console.log(`✔ ${id} ${title}${detail ? ' · ' + detail : ''}`)
  } catch (error) {
    results.push({ id, title, ok: false, detail: String(error?.message ?? error), ms: Date.now() - started })
    console.log(`✘ ${id} ${title} · ${error?.message ?? error}`)
    await page.screenshot({ path: path.join(OUT, `${id}-ERROR.png`), fullPage: true }).catch(() => {})
  }
}
const shot = (name) => page.screenshot({ path: path.join(OUT, name), fullPage: true })
const newsCount = () => page.getByTestId('news-item').count()

await step('CP-01', 'GET /news: el listado se consulta y se renderiza', async () => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByTestId('news-item').first().waitFor({ timeout: 20_000 })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('news-item').first().waitFor({ timeout: 20_000 })
  await shot('01-listado-get.png')
  return `${await newsCount()} noticias en pantalla`
})

await step('CP-02', 'GET /news?page=1: paginación (Cargar más)', async () => {
  await page.getByRole('button', { name: 'Cargar más' }).click()
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="news-item"]').length >= 12, null, { timeout: 15_000 })
  await page.waitForTimeout(500) // la copia en public-api se escribe en segundo plano
  await shot('02-listado-paginado.png')
  const snap = await inspectApplication('CP-02 en línea, tras consultar')
  return `${await newsCount()} noticias · SW ${snap.serviceWorker.state} · caches: ${snap.cacheStorage.map((c) => `${c.name}(${c.entries})`).join(', ')}`
})

await step('CP-03', 'POST /subscriptions en línea: 202 y registro en BD', async () => {
  await page.getByLabel('Correo').fill(EMAIL_ONLINE)
  await page.getByLabel('Acepto el aviso de privacidad').check()
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/v1/subscriptions') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Avisarme' }).click(),
  ])
  await page.getByTestId('subscribe-result').waitFor()
  await shot('03-post-en-linea.png')
  if (response.status() !== 202) throw new Error(`status ${response.status()}`)
  return `${EMAIL_ONLINE} -> ${response.status()}`
})

await step('CP-04', 'Sin conexión: el listado se sirve desde Cache Storage', async () => {
  await context.setOffline(true)
  await setServiceWorkerOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByTestId('news-item').first().waitFor({ timeout: 15_000 })
  await page.getByText('Sin conexión.').first().waitFor()
  await shot('04-offline-listado-desde-cache.png')
  await page.waitForTimeout(300)
  const fromCache = consoleLines.some((l) => l.includes('[sw]') && l.includes('la red falló, se usa la copia guardada'))
  if (!fromCache) throw new Error('el Service Worker no reportó respuesta desde Cache Storage')
  return `${await newsCount()} noticias visibles sin red, servidas por el SW desde public-api`
})

await step('CP-05', 'POST sin conexión: se encola en IndexedDB (Background Sync)', async () => {
  await page.getByLabel('Correo').fill(EMAIL_OFFLINE)
  await page.getByLabel('Acepto el aviso de privacidad').check()
  await page.getByRole('button', { name: 'Avisarme' }).click()
  await page.getByText('Sin conexión: guardamos tu registro').waitFor({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Actualizar estado' }).click()
  await page.waitForTimeout(500)
  await shot('05-offline-post-en-cola.png')
  const snap = await inspectApplication('CP-05 sin conexión, tras el envío')
  const queued = snap.indexedDB.backgroundSyncQueue
  if (queued.length === 0) throw new Error('la cola de IndexedDB está vacía')
  return `${queued.length} petición(es) en ${queued[0].queueName}: ${queued[0].payload}`
})

await step('CP-06', 'Vuelve la red: la cola se sincroniza y llega a la BD', async () => {
  await setServiceWorkerOffline(false)
  await context.setOffline(false)
  const cdp = await context.newCDPSession(page)
  const registrations = new Map()
  cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations: list }) =>
    list.forEach((r) => registrations.set(r.scopeURL, r.registrationId)))
  await cdp.send('ServiceWorker.enable')
  await page.waitForTimeout(800)
  const registrationId = registrations.get(BASE + '/')
  if (registrationId) {
    await cdp.send('ServiceWorker.dispatchSyncEvent', { origin: BASE, registrationId, tag: SYNC_TAG, lastChance: false })
      .catch(() => {})
  }
  await page.getByText('Volvió la conexión').waitFor({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Actualizar estado' }).click()
  await page.waitForTimeout(500)
  await shot('06-online-sincronizado.png')
  const snap = await inspectApplication('CP-06 en línea, tras sincronizar')
  if (snap.indexedDB.backgroundSyncQueue.length !== 0) throw new Error('la cola no se vació')
  return `cola vacía; ${EMAIL_OFFLINE} reenviado`
})

await context.close() // escribe network.har
await browser.close()

const md = (v) => String(v ?? '—').replace(/\|/g, '\\|')
const networkMd = [
  `# Tráfico de red /api (${new Date().toISOString()})`, '',
  `Origen: ${BASE}`, '',
  '| Caso | Método | URL | Status | Desde SW | Latencia (TTFB) ms | Total ms | Payload enviado | Respuesta B | Cache-Control | Server-Timing | X-Queued |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...network.map((n) => `| ${n.step} | ${n.method} | ${md(n.url)} | ${md(n.status)} | ${n.fromServiceWorker ? 'sí' : 'no'} | ${md(n.latencyMs)} | ${md(n.totalMs)} | ${md(n.requestPayload ?? n.requestBytes)} | ${md(n.responseBytes)} | ${md(n.headers?.['cache-control'])} | ${md(n.headers?.['server-timing'])} | ${md(n.headers?.['x-queued'])} |`),
].join('\n')

const summary = [
  '# Resumen del recorrido automático', '',
  `- Fecha: ${new Date().toISOString()}`,
  `- PWA: ${BASE}`,
  `- Correo enviado en línea: \`${EMAIL_ONLINE}\``,
  `- Correo enviado sin conexión: \`${EMAIL_OFFLINE}\``, '',
  '| Caso | Descripción | Resultado | Detalle | Duración |', '|---|---|---|---|---|',
  ...results.map((r) => `| ${r.id} | ${r.title} | ${r.ok ? 'PASA' : 'FALLA'} | ${md(r.detail)} | ${r.ms} ms |`),
  '', 'Comprobación en la base de datos (bloque B de `docs/testing/sql/03_evidence_queries.sql`):', '',
  '```sql', `select email, language, source, consented_at, created_at from game.launch_subscriptions`,
  `where email in ('${EMAIL_ONLINE}', '${EMAIL_OFFLINE}');`, '```',
].join('\n')

await writeFile(path.join(OUT, 'network-report.md'), networkMd)
await writeFile(path.join(OUT, 'network-report.json'), JSON.stringify(network, null, 2))
await writeFile(path.join(OUT, 'application-report.json'), JSON.stringify(application, null, 2))
await writeFile(path.join(OUT, 'console.log'), consoleLines.join('\n'))
await writeFile(path.join(OUT, 'summary.md'), summary)
console.log(`\nEvidencias en ${OUT}`)
process.exitCode = results.every((r) => r.ok) ? 0 : 1
