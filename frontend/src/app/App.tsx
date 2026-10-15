import { NewsList } from '../features/news'
import { SubscribeForm } from '../features/landing'
import { OfflineBanner } from '../shared/pwa/OfflineBanner'
import { UpdatePrompt } from '../shared/pwa/UpdatePrompt'
import { PwaStatus } from '../shared/pwa/PwaStatus'
import css from './App.module.css'

export function App() {
  return (
    <>
      <OfflineBanner />
      <UpdatePrompt />
      <header className={css.hero}>
        <p className={css.kicker}>Hex Studio · RPG de acción 2D isométrico</p>
        <h1>The Day I Made That Promise</h1>
        <p>El poder no se encuentra, se fabrica.</p>
      </header>
      <main className={css.layout}>
        <NewsList />
        <div className={css.side}>
          <SubscribeForm />
          <PwaStatus />
        </div>
      </main>
      <footer className={css.footer}>Laboratorio de pruebas · PWA conectada a Spring Boot y PostgreSQL (Supabase)</footer>
    </>
  )
}
