export type ShellGameMode = 'opencase' | 'mountain' | 'bank'

export type PersistedShellUi = {
  gameMode: ShellGameMode
  showWelcome: boolean
}

const SHELL_UI_KEY = 'casino_shell_ui_v1'

function isGameMode(v: unknown): v is ShellGameMode {
  return v === 'opencase' || v === 'mountain' || v === 'bank'
}

export function readPersistedShellUi(): PersistedShellUi | null {
  try {
    const raw = sessionStorage.getItem(SHELL_UI_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as Partial<PersistedShellUi>
    if (!o || typeof o !== 'object') return null
    if (!isGameMode(o.gameMode) || typeof o.showWelcome !== 'boolean') return null
    return { gameMode: o.gameMode, showWelcome: o.showWelcome }
  } catch {
    return null
  }
}

export function writePersistedShellUi(state: PersistedShellUi) {
  try {
    sessionStorage.setItem(SHELL_UI_KEY, JSON.stringify(state))
  } catch {
    /* private mode / quota */
  }
}

export function clearPersistedShellUi() {
  try {
    sessionStorage.removeItem(SHELL_UI_KEY)
  } catch {
    /* ignore */
  }
}

/** Стартовое состояние до гидрации — уменьшает мигание экрана при F5 */
export function readInitialShellFromStorage(pathname: string): PersistedShellUi | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/profile') || pathname.startsWith('/login')) {
    return null
  }
  return readPersistedShellUi()
}
