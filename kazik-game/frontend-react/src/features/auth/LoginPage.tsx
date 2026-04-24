import { useState, type FormEvent } from 'react'
import { StolotoLogo } from '../../shared/ui/StolotoLogo'

type Props = {
  login: (username: string, password: string) => Promise<void>
}

const HINT_USERS = [
  'chelentano:chill123',
  'exe:exe123',
  'brotato:bro123',
  'zhestkiy:zhest123',
  'dron:dron123',
  'kogan:kog123',
  'penka:penka123',
  'husband:hus123',
  'rama:rama123',
  'yakut:yak123',
  'senator:sen123',
  'beekeeper:bee123',
  'habib:habib123',
  'elk:elk123',
  'frol:fro123',
  'nigger:niga123',
  'aleksey_m:password',
  'vip_player:password — роль ADMIN',
]

export function LoginPage({ login }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="welcome-layout">
      <div className="welcome-content shell-card" style={{ maxWidth: 440, margin: '48px auto' }}>
        <StolotoLogo className="welcome-logo mx-auto mb-4" />
        <h1 className="welcome-title" style={{ fontSize: '1.6rem' }}>Вход</h1>
        <p className="welcome-subtitle">
          Войдите под тестовым пользователем или админом <strong>vip_player</strong> для доступа к админ-панели.
        </p>

        <form onSubmit={submit} className="login-form" style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <label className="filter-group" style={{ textAlign: 'left' }}>
            <span>Логин</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled={busy}
            />
          </label>
          <label className="filter-group" style={{ textAlign: 'left' }}>
            <span>Пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={busy}
            />
          </label>
          {error && <p className="section-note" style={{ color: '#f87171' }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-large" disabled={busy || !username.trim()}>
            {busy ? 'Вход…' : 'Войти'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 16, width: '100%' }}
          onClick={() => setShowHint((v) => !v)}
        >
          {showHint ? 'Скрыть подсказку по тестовым логинам' : 'Тестовые логины'}
        </button>
        {showHint && (
          <ul style={{ marginTop: 12, textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
            {HINT_USERS.map((line) => (
              <li key={line}><code style={{ fontSize: '0.8rem' }}>{line}</code></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
