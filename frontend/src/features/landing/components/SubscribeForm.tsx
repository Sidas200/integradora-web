import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../../shared/api/client'
import { usePwaState } from '../../../shared/pwa/registerSW'
import { log } from '../../../shared/lab/logger'
import css from './SubscribeForm.module.css'

type Result = { kind: 'idle' | 'sending' | 'sent' | 'queued' | 'error'; text?: string }

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const [consent, setConsent] = useState(false)
  const [result, setResult] = useState<Result>({ kind: 'idle' })
  const { lastMessage } = usePwaState()

  useEffect(() => {
    if (lastMessage?.type === 'SUBSCRIPTION_SENT' && result.kind === 'queued') {
      setResult({ kind: 'sent', text: 'Volvió la conexión: tu registro pendiente ya se envió.' })
    }
  }, [lastMessage, result.kind])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = { email: email.trim().toLowerCase(), language, consent: true as const }
    log('api', 'Payload del formulario de aviso', body)
    setResult({ kind: 'sending' })
    try {
      const { response, error } = await api.POST('/subscriptions', { body })
      if (response.headers.get('X-Queued') === '1') {
        setResult({ kind: 'queued', text: 'Sin conexión: guardamos tu registro y se enviará solo al volver la red.' })
      } else if (response.status === 202) {
        setResult({ kind: 'sent', text: '¡Listo! Te avisaremos cuando salga el juego.' })
        setEmail('')
        setConsent(false)
      } else {
        log('error', `La API respondió ${response.status}`, error)
        setResult({ kind: 'error', text: 'Revisa el correo e inténtalo de nuevo.' })
      }
    } catch (e) {
      log('error', 'Fallo de red no atendido por el Service Worker', e)
      setResult({ kind: 'error', text: 'No se pudo enviar. Inténtalo de nuevo.' })
    }
  }

  return (
    <section aria-labelledby="subscribe-title" className={css.card}>
      <h2 id="subscribe-title">Avísame del lanzamiento</h2>
      <form onSubmit={(e) => void submit(e)} className={css.form}>
        <label>
          Correo
          <input type="email" required maxLength={254} autoComplete="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
        </label>
        <label>
          Idioma
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className={css.check}>
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Acepto el aviso de privacidad
        </label>
        <button type="submit" disabled={result.kind === 'sending'}>
          {result.kind === 'sending' ? 'Enviando…' : 'Avisarme'}
        </button>
      </form>
      {result.text && (
        <p role="status" className={css.result} data-kind={result.kind} data-testid="subscribe-result">{result.text}</p>
      )}
    </section>
  )
}
