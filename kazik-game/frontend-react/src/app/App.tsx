import { useEffect, useMemo, useState } from 'react'
import { LobbyPage } from '../features/lobby/LobbyPage'
import { RoomPage } from '../features/room/RoomPage'
import { InstructionModal } from '../features/instruction/InstructionModal'
import { OPENCASE_INSTRUCTION } from '../features/instruction/opencaseInstruction'
import { AdminPage } from '../features/admin/AdminPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { WelcomePage } from '../features/welcome/WelcomePage'
import { ApiClient, type UserProfile } from '../shared/api/client'
import { LoginPage } from '../features/auth/LoginPage'
import { StolotoLogo } from '../shared/ui/StolotoLogo'
import {
  clearPersistedShellUi,
  readInitialShellFromStorage,
  readPersistedShellUi,
  writePersistedShellUi,
} from '../shared/shellUiPersistence'

type View = 'lobby' | 'room' | 'admin' | 'profile'
type GameMode = 'opencase' | 'mountain' | 'bank'

type ShellBootstrap =
  | { kind: 'room' }
  | { kind: 'admin' }
  | { kind: 'adminRejected' }
  | { kind: 'profile' }
  | { kind: 'lobby' }

const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/'
const initialShellStored = readInitialShellFromStorage(initialPath)

function resolveViewFromPath(pathname: string): View {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/login')) return 'lobby'
  return 'lobby'
}

type AuthPhase = 'loading' | 'login' | 'ready'

export function App() {
  const api = useMemo(() => new ApiClient(), [])
  const [authPhase, setAuthPhase] = useState<AuthPhase>('loading')
  const [view, setView] = useState<View>(() => resolveViewFromPath(window.location.pathname))
  const [gameMode, setGameMode] = useState<GameMode>(() => initialShellStored?.gameMode ?? 'opencase')
  const [roomId, setRoomId] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    const p = initialPath
    if (p.startsWith('/admin') || p.startsWith('/profile')) return false
    if (initialShellStored && !initialShellStored.showWelcome) return false
    return true
  })
  const [userId, setUserId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [instructionOpen, setInstructionOpen] = useState(false)
  const isRoomActive = view === 'room' && roomId !== null

  const mountainUrl = import.meta.env.VITE_MOUNTAIN_APP_URL || '/mountain/'
  const bankUrl = import.meta.env.VITE_BANK_APP_URL || '/bank/'

  const handleSelectGame = (mode: GameMode) => {
    setShowWelcome(false)
    setGameMode(mode)
    if (mode === 'opencase' && view !== 'room') {
      setView('lobby')
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/')
      }
    }
  }

  const loadSessionData = async (uid: number, role: string | null): Promise<ShellBootstrap> => {
    const [active, userProfile] = await Promise.all([
      api.getActiveRoom(uid),
      api.getUserProfile(uid),
    ])
    if (active.room_id) {
      setRoomId(active.room_id)
      setView('room')
      setProfile(userProfile)
      return { kind: 'room' }
    }
    setRoomId(null)
    const path = window.location.pathname
    if (path.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        if (path.startsWith('/admin')) window.history.replaceState({}, '', '/')
        setView('lobby')
        setProfile(userProfile)
        return { kind: 'adminRejected' }
      }
      setView('admin')
      setProfile(userProfile)
      return { kind: 'admin' }
    }
    if (path.startsWith('/profile')) {
      setView('profile')
      setProfile(userProfile)
      return { kind: 'profile' }
    }
    setView('lobby')
    setProfile(userProfile)
    return { kind: 'lobby' }
  }

  const synchronizeShellAfterSession = (boot: ShellBootstrap) => {
    if (boot.kind === 'room') {
      setShowWelcome(false)
      setGameMode('opencase')
      return
    }
    if (boot.kind === 'admin') {
      setShowWelcome(false)
      setGameMode('opencase')
      return
    }
    if (boot.kind === 'adminRejected') {
      setShowWelcome(true)
      setGameMode('opencase')
      return
    }
    if (boot.kind === 'profile') {
      setShowWelcome(false)
      setGameMode('opencase')
      return
    }
    const stored = readPersistedShellUi()
    if (stored) {
      setGameMode(stored.gameMode)
      setShowWelcome(stored.showWelcome)
      return
    }
    setShowWelcome(true)
    setGameMode('opencase')
  }

  /** Чтобы форма входа была на предсказуемом URL: откройте вручную http://…:8080/login */
  useEffect(() => {
    if (authPhase !== 'login') return
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
    }
  }, [authPhase])

  useEffect(() => {
    if (authPhase !== 'ready') return
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/')
    }
  }, [authPhase])

  useEffect(() => {
    if (authPhase !== 'ready' || userId === null) return
    writePersistedShellUi({ gameMode, showWelcome })
  }, [authPhase, userId, gameMode, showWelcome])

  useEffect(() => {
    let cancelled = false
    const tryRestoreSession = async () => {
      const token = ApiClient.getAuthToken()
      if (!token) {
        if (!cancelled) setAuthPhase('login')
        return
      }
      let me: Awaited<ReturnType<ApiClient['getSession']>>
      try {
        me = await api.getSession()
      } catch {
        ApiClient.setAuthToken(null)
        if (!cancelled) setAuthPhase('login')
        return
      }
      if (cancelled) return
      setUserId(me.userId)
      setUserRole(me.role ?? null)
      try {
        const boot = await loadSessionData(me.userId, me.role ?? null)
        if (cancelled) return
        synchronizeShellAfterSession(boot)
      } catch {
        // Токен валиден, но /active-room или /profile упал — не сбрасывать сессию (иначе «выбрасывает на логин»).
        if (cancelled) return
        setRoomId(null)
        setView('lobby')
        setShowWelcome(true)
        setGameMode('opencase')
      }
      if (!cancelled) setAuthPhase('ready')
    }
    tryRestoreSession().catch(() => {
      if (!cancelled) setAuthPhase('login')
    })
    return () => { cancelled = true }
  }, [api])

  const handleLogin = async (username: string, password: string) => {
    const session = await api.login(username, password)
    clearPersistedShellUi()
    setUserId(session.userId)
    setUserRole(session.role ?? null)
    const [roomResult, profileResult] = await Promise.allSettled([
      api.getActiveRoom(session.userId),
      api.getUserProfile(session.userId),
    ])
    const active = roomResult.status === 'fulfilled' ? roomResult.value : { room_id: null }
    const userProfile = profileResult.status === 'fulfilled' ? profileResult.value : null
    if (active.room_id) {
      setRoomId(active.room_id)
      setView('room')
      setShowWelcome(false)
      setGameMode('opencase')
    } else {
      setRoomId(null)
      const path = window.location.pathname
      if (path.startsWith('/admin')) {
        if ((session.role ?? null) !== 'ADMIN') {
          if (path.startsWith('/admin')) window.history.replaceState({}, '', '/')
          setView('lobby')
          setShowWelcome(true)
          setGameMode('opencase')
        } else {
          setView('admin')
          setShowWelcome(false)
          setGameMode('opencase')
        }
      } else if (path.startsWith('/profile')) {
        setView('profile')
        setShowWelcome(false)
        setGameMode('opencase')
      } else {
        setView('lobby')
        setShowWelcome(true)
        setGameMode('opencase')
      }
    }
    setProfile(userProfile)
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/')
    }
    setAuthPhase('ready')
  }

  const handleLogout = () => {
    ApiClient.setAuthToken(null)
    clearPersistedShellUi()
    setUserId(null)
    setUserRole(null)
    setProfile(null)
    setRoomId(null)
    setView('lobby')
    setGameMode('opencase')
    setShowWelcome(true)
    setAuthPhase('login')
    if (window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login')
    }
  }

  useEffect(() => {
    const onPopstate = () => {
      if (roomId) {
        setView('room')
        return
      }
      const path = window.location.pathname
      const nextView = resolveViewFromPath(path)
      if (nextView === 'admin' && userRole !== 'ADMIN') {
        if (path.startsWith('/admin')) window.history.replaceState({}, '', '/')
        setView('lobby')
        setRoomId(null)
        return
      }
      setView(nextView)
      if (nextView !== 'room') setRoomId(null)
    }
    window.addEventListener('popstate', onPopstate)
    return () => window.removeEventListener('popstate', onPopstate)
  }, [roomId, userRole])

  const navigateTo = (path: string, nextView: View, force = false) => {
    if (!force && roomId && nextView !== 'room') {
      return
    }
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setView(nextView)
  }

  const handleOpenProfileFromWelcome = () => {
    setShowWelcome(false)
    setGameMode('opencase')
    navigateTo('/profile', 'profile', true)
  }

  const handleOpenAdminFromWelcome = () => {
    setShowWelcome(false)
    setGameMode('opencase')
    navigateTo('/admin', 'admin', true)
  }

  // Removed synchronous setState effect that was triggering cascading renders

  const showToast = (message: string, type = 'info') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  if (authPhase === 'loading') {
    return (
      <div className="welcome-layout">
        <p style={{ textAlign: 'center', marginTop: '20vh', color: 'var(--text-soft)' }}>Загрузка…</p>
      </div>
    )
  }

  if (authPhase === 'login') {
    return <LoginPage login={handleLogin} />
  }

  if (showWelcome) {
    return (
      <WelcomePage
        onSelectGame={handleSelectGame}
        onOpenProfile={handleOpenProfileFromWelcome}
        onOpenAdmin={handleOpenAdminFromWelcome}
        showAdminEntry={userRole === 'ADMIN'}
        onLogout={handleLogout}
        bonusBalance={profile?.bonus_balance ?? 0}
        userId={userId}
      />
    )
  }

  return (
    <div id="app">
      {!isRoomActive && (
        <header className="header shell-card">
          <div className="brand-block">
            <StolotoLogo className="brand-logo" />
            <h1>Opencase Lobby</h1>
            <p className="brand-subtitle">Единая платформа мини-игр с общим бонусным балансом.</p>
          </div>
          <div className="header-actions">
            <div className="user-info shell-card shell-card--compact">
              <span>Бонусы: {profile?.bonus_balance ?? 0}</span>
              <span className="user-id">User ID: {userId ?? '-'}</span>
            </div>
            {gameMode === 'opencase' && (
              <button type="button" className="btn btn-secondary" onClick={() => setInstructionOpen(true)}>
                Инструкция
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowWelcome(true)}>Игры</button>
            <button type="button" className="btn btn-secondary" onClick={() => handleLogout()}>
              Выйти
            </button>
          </div>
        </header>
      )}

      <main className="main">
        {toast && <section className="toast" data-type={toast.type}>{toast.message}</section>}

        {gameMode === 'opencase' && view === 'lobby' && userId !== null && (
          <LobbyPage
            userId={userId}
            onJoinRoom={(nextRoomId) => {
              setRoomId(nextRoomId)
              setView('room')
            }}
            toast={showToast}
          />
        )}

        {gameMode === 'opencase' && view === 'room' && roomId && userId !== null && (
          <section id="room-view" className="view active">
            <RoomPage
              roomId={roomId}
              userId={userId}
              onExit={() => {
                setRoomId(null)
                navigateTo('/', 'lobby', true)
                api.getUserProfile(userId).then(setProfile).catch(() => undefined)
              }}
              toast={showToast}
              onOpenInstruction={() => setInstructionOpen(true)}
            />
          </section>
        )}

        {gameMode === 'opencase' && view === 'profile' && userId !== null && (
          <ProfilePage
            userId={userId}
            onBack={() => navigateTo('/', 'lobby')}
            toast={showToast}
          />
        )}
        {userRole === 'ADMIN' && gameMode === 'opencase' && view === 'admin' && (
          <AdminPage onBack={() => navigateTo('/', 'lobby')} toast={showToast} />
        )}

        {gameMode === 'mountain' && (
          <section className="external-game-shell shell-card">
            <div className="external-game-shell__header">
              <div>
                <h2>Mountain-hiking-minigame</h2>
                <p>Модуль подключен в единую Stoloto-платформу.</p>
              </div>
            </div>
            <iframe title="Mountain-hiking-minigame" src={mountainUrl} className="external-game-frame" />
          </section>
        )}

        {gameMode === 'bank' && (
          <section className="external-game-shell shell-card">
            <div className="external-game-shell__header">
              <div>
                <h2>Bank-minigame</h2>
                <p>Модуль подключен в единую Stoloto-платформу.</p>
              </div>
            </div>
            <iframe title="Bank-minigame" src={bankUrl} className="external-game-frame" />
          </section>
        )}
      </main>

      {gameMode === 'opencase' && (
        <InstructionModal open={instructionOpen} onClose={() => setInstructionOpen(false)} config={OPENCASE_INSTRUCTION} />
      )}
    </div>
  )
}
