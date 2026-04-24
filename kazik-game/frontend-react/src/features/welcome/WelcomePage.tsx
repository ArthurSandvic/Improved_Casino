import { StolotoLogo } from '../../shared/ui/StolotoLogo'

type GameId = 'opencase' | 'mountain' | 'bank'

type WelcomePageProps = {
  onSelectGame: (game: GameId) => void
  onOpenProfile: () => void
  onOpenAdmin?: () => void
  showAdminEntry?: boolean
  onLogout?: () => void
  bonusBalance: number
  userId: number | null
}

export function WelcomePage({
  onSelectGame,
  onOpenProfile,
  onOpenAdmin,
  showAdminEntry,
  onLogout,
  bonusBalance,
  userId,
}: WelcomePageProps) {
  return (
    <div className="welcome-layout">
      <div className="welcome-top-actions">
        <div className="user-info shell-card shell-card--compact">
          <span>Бонусы: {bonusBalance}</span>
          <span className="user-id">User ID: {userId ?? '-'}</span>
        </div>
        <button className="btn btn-secondary" onClick={onOpenProfile}>
          Профиль
        </button>
        {showAdminEntry && onOpenAdmin && (
          <button type="button" className="btn btn-secondary" onClick={onOpenAdmin}>
            Админ-панель
          </button>
        )}
        {onLogout && (
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Выйти
          </button>
        )}
      </div>
      <div className="welcome-content shell-card">
        <StolotoLogo className="welcome-logo mx-auto mb-4" />
        <h1 className="welcome-title">СТОЛОТО Мини-игры</h1>
        <p className="welcome-subtitle">
          Выберите игру и используйте единый бонусный баланс во всех мини-играх.
        </p>

        <div className="game-picks">
          <div className="welcome-feature welcome-game-card shell-card shell-card--inner">
            <div className="welcome-game-card__top">
              <div className="welcome-feature-num">I</div>
              <h3>Opencase</h3>
            </div>
            <p className="welcome-game-card__desc">
              Комната, соперники и растущее напряжение: чем ближе финал, тем острее азарт. Сумеете ли вы забрать главный приз?
            </p>
            <div className="welcome-game-card__actions">
              <button type="button" className="btn btn-primary btn-large game-pick-btn" onClick={() => onSelectGame('opencase')}>
                Играть
              </button>
            </div>
          </div>
          <div className="welcome-feature welcome-game-card shell-card shell-card--inner">
            <div className="welcome-game-card__top">
              <div className="welcome-feature-num">II</div>
              <h3>Mountain Hiking</h3>
            </div>
            <p className="welcome-game-card__desc">
              Подъём к вершине среди соперников: каждый шаг — на счёт удачи. Кто окажется быстрее и смелее — решит одно мгновение.
            </p>
            <div className="welcome-game-card__actions">
              <button type="button" className="btn btn-primary btn-large game-pick-btn" onClick={() => onSelectGame('mountain')}>
                Играть
              </button>
            </div>
          </div>
          <div className="welcome-feature welcome-game-card shell-card shell-card--inner">
            <div className="welcome-game-card__top">
              <div className="welcome-feature-num">III</div>
              <h3>Bank</h3>
            </div>
            <p className="welcome-game-card__desc">
              Взлом сейфа, бусты на удачу и мгновенный исход: драйв до последней секунды и шанс сорвать куш раньше остальных.
            </p>
            <div className="welcome-game-card__actions">
              <button type="button" className="btn btn-primary btn-large game-pick-btn" onClick={() => onSelectGame('bank')}>
                Играть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
