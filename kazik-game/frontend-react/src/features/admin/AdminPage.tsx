import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiClient, type AdminConfig, type AdminRoomItem, type ConfigValidation } from '../../shared/api/client'

type Props = {
  onBack: () => void
  toast: (message: string, type?: string) => void
}

type AdminGameTab = 'opencase' | 'bank' | 'mountain'

const initialConfig: AdminConfig = {
  max_players: 4,
  entry_fee: 1000,
  prize_pool_pct: 0.8,
  boost_enabled: true,
  boost_cost: 200,
  boost_multiplier: 0.2,
  bot_win_policy: 'return_pool',
  waiting_timer_seconds: 60,
  mountain_min_bet: 50,
  mountain_max_bet: 400,
  bank_filter_entry_fee: 100,
  bank_filter_seats: 6,
}

export function AdminPage({ onBack, toast }: Props) {
  const api = useMemo(() => new ApiClient(), [])
  const [adminTab, setAdminTab] = useState<AdminGameTab>('opencase')
  const [config, setConfig] = useState<AdminConfig>(initialConfig)
  const [validation, setValidation] = useState<ConfigValidation | null>(null)
  const [rooms, setRooms] = useState<AdminRoomItem[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const selectedRoomIdRef = useRef<number | null>(null)
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId
  }, [selectedRoomId])
  const [roomConfig, setRoomConfig] = useState<Omit<AdminConfig, 'bot_win_policy'>>({
    max_players: 4,
    entry_fee: 1000,
    prize_pool_pct: 0.8,
    boost_enabled: true,
    boost_cost: 200,
    boost_multiplier: 0.2,
  })

  const loadRooms = useCallback(async () => {
    try {
      const data = await api.getAdminRooms()
      setRooms(data)
      const current = selectedRoomIdRef.current
      if (!current && data.length) {
        const waiting = data.find((room) => room.status === 'waiting')
        const room = waiting ?? data[0]
        setSelectedRoomId(room.id)
        setRoomConfig({
          max_players: room.max_players,
          entry_fee: room.entry_fee,
          prize_pool_pct: room.prize_pool_pct,
          boost_enabled: room.boost_enabled,
          boost_cost: room.boost_cost,
          boost_multiplier: room.boost_multiplier,
        })
      }
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }, [api, toast])

  const validate = useCallback(async (next: AdminConfig) => {
    try {
      const v = await api.validateConfig(next)
      setValidation(v)
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }, [api, toast])

  useEffect(() => {
    let ignore = false
    const boot = async () => {
      try {
        const cfg = await api.getConfig()
        if (ignore) return
        setConfig(cfg)
        await validate(cfg)
      } catch (e) {
        if (!ignore) toast((e as Error).message, 'error')
      }
      if (!ignore) {
        await loadRooms().catch(() => undefined)
      }
    }
    void boot()
    return () => {
      ignore = true
    }
  }, [api, loadRooms, toast, validate])

  const update = useCallback(<K extends keyof AdminConfig>(key: K, value: AdminConfig[K]) => {
    setConfig((prev) => {
      const next: AdminConfig = { ...prev, [key]: value }
      queueMicrotask(() => {
        validate(next).catch(() => undefined)
      })
      return next
    })
  }, [validate])

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null
  const canEditSelectedRoom = selectedRoom?.status === 'waiting'

  const validationIssues = [...(validation?.warnings || []), ...(validation?.errors || [])]
  const riskLabel =
    validation?.risk_level === 'HIGH'
      ? 'Высокий риск'
      : validation?.risk_level === 'MEDIUM'
        ? 'Средний риск'
        : 'Низкий риск'

  return (
    <section id="admin-view" className="view active">
      <div className="admin-header shell-card">
        <div>
          <p className="eyebrow">Администрирование</p>
          <h2>Единая админ-панель (Opencase · Bank · Mountain)</h2>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>← Назад</button>
      </div>

      <div className="shell-card admin-tabs">
        {(['opencase', 'bank', 'mountain'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={adminTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setAdminTab(tab)}
          >
            {tab === 'opencase' ? 'Opencase' : tab === 'bank' ? 'Bank' : 'Mountain'}
          </button>
        ))}
      </div>

      <div className="shell-card admin-rooms-panel">
        <div className="section-title-row compact">
          <h3>Комнаты</h3>
          <span className="section-note">Редактирование доступно для комнат в статусе ожидания; баланс общий для всех мини-игр</span>
        </div>
        <div className="admin-rooms-layout">
          <div className="admin-room-list">
            {rooms.map((room) => {
              const editable = room.status === 'waiting'
              const selected = selectedRoomId === room.id
              return (
                <button
                  key={room.id}
                  type="button"
                  className={[
                    'admin-room-pill',
                    selected ? 'admin-room-pill--selected' : '',
                    !editable ? 'admin-room-pill--locked' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    setSelectedRoomId(room.id)
                    setRoomConfig({
                      max_players: room.max_players,
                      entry_fee: room.entry_fee,
                      prize_pool_pct: room.prize_pool_pct,
                      boost_enabled: room.boost_enabled,
                      boost_cost: room.boost_cost,
                      boost_multiplier: room.boost_multiplier,
                    })
                  }}
                >
                  <strong>{room.name}</strong>
                  <span className="section-note">#{room.id} • {room.status}</span>
                  <span className="section-note">Игроков: {room.participants_count}/{room.max_players}</span>
                </button>
              )
            })}
          </div>
          <div>
            {!selectedRoom ? (
              <div className="empty-state">Выберите комнату для редактирования.</div>
            ) : (
              <>
                <p className="section-note admin-room-detail-note">Комната: {selectedRoom.name} (#{selectedRoom.id})</p>
                <div className="form-group admin-field">
                  <label htmlFor="room-max-players">Макс. игроков</label>
                  <div className="admin-slider-row">
                    <input
                      id="room-max-players"
                      type="range"
                      className="admin-range-input"
                      min={2}
                      max={10}
                      value={roomConfig.max_players}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, max_players: Number(e.target.value) }))}
                    />
                    <span className="admin-range-value">{roomConfig.max_players}</span>
                  </div>
                </div>
                <div className="form-group admin-field">
                  <label htmlFor="room-entry">Вход</label>
                  <div className="admin-slider-row">
                    <input
                      id="room-entry"
                      type="range"
                      className="admin-range-input"
                      min={100}
                      max={5000}
                      step={100}
                      value={roomConfig.entry_fee}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, entry_fee: Number(e.target.value) }))}
                    />
                    <span className="admin-range-value">{roomConfig.entry_fee}</span>
                  </div>
                </div>
                <div className="form-group admin-field">
                  <label htmlFor="room-prize">Призовой фонд (%)</label>
                  <div className="admin-slider-row">
                    <input
                      id="room-prize"
                      type="range"
                      className="admin-range-input"
                      min={50}
                      max={95}
                      value={Math.round(roomConfig.prize_pool_pct * 100)}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, prize_pool_pct: Number(e.target.value) / 100 }))}
                    />
                    <span className="admin-range-value">{Math.round(roomConfig.prize_pool_pct * 100)}%</span>
                  </div>
                </div>
                <div className="form-group admin-field admin-field--checkbox">
                  <label htmlFor="room-boost">
                    <input
                      id="room-boost"
                      type="checkbox"
                      checked={roomConfig.boost_enabled}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, boost_enabled: e.target.checked }))}
                    />
                    <span>Буст включён</span>
                  </label>
                </div>
                <div className="form-group admin-field">
                  <label htmlFor="room-boost-cost">Стоимость буста</label>
                  <div className="admin-slider-row">
                    <input
                      id="room-boost-cost"
                      type="range"
                      className="admin-range-input"
                      min={50}
                      max={1000}
                      step={50}
                      value={roomConfig.boost_cost}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, boost_cost: Number(e.target.value) }))}
                    />
                    <span className="admin-range-value">{roomConfig.boost_cost}</span>
                  </div>
                </div>
                <div className="form-group admin-field">
                  <label htmlFor="room-boost-mult">Множитель буста (%)</label>
                  <div className="admin-slider-row">
                    <input
                      id="room-boost-mult"
                      type="range"
                      className="admin-range-input"
                      min={10}
                      max={50}
                      value={Math.round(roomConfig.boost_multiplier * 100)}
                      disabled={!canEditSelectedRoom}
                      onChange={(e) => setRoomConfig((prev) => ({ ...prev, boost_multiplier: Number(e.target.value) / 100 }))}
                    />
                    <span className="admin-range-value">{Math.round(roomConfig.boost_multiplier * 100)}%</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!selectedRoomId || !canEditSelectedRoom}
                  onClick={async () => {
                    if (!selectedRoomId) return
                    try {
                      await api.updateRoomConfig(selectedRoomId, roomConfig)
                      toast('Настройки комнаты сохранены', 'success')
                      loadRooms().catch(() => undefined)
                    } catch (e) {
                      toast((e as Error).message, 'error')
                    }
                  }}
                >
                  Сохранить для этой комнаты
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="config-form shell-card">
        {adminTab === 'opencase' && (
          <>
            <div className="section-title-row compact">
              <h3>Opencase — шаблон комнат и таймер</h3>
              <span className="section-note">Значения по умолчанию для новых комнат и время ожидания игроков</span>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-wait">Таймер ожидания (сек)</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-wait"
                  type="range"
                  className="admin-range-input"
                  min={15}
                  max={120}
                  value={config.waiting_timer_seconds ?? 60}
                  onChange={(e) => update('waiting_timer_seconds', Number(e.target.value))}
                />
                <span className="admin-range-value">{config.waiting_timer_seconds ?? 60} с</span>
              </div>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-maxp">Макс. игроков</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-maxp"
                  type="range"
                  className="admin-range-input"
                  min={2}
                  max={10}
                  value={config.max_players}
                  onChange={(e) => update('max_players', Number(e.target.value))}
                />
                <span className="admin-range-value">{config.max_players}</span>
              </div>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-entry">Вход</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-entry"
                  type="range"
                  className="admin-range-input"
                  min={100}
                  max={5000}
                  step={100}
                  value={config.entry_fee}
                  onChange={(e) => update('entry_fee', Number(e.target.value))}
                />
                <span className="admin-range-value">{config.entry_fee}</span>
              </div>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-prize">Призовой фонд (%)</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-prize"
                  type="range"
                  className="admin-range-input"
                  min={50}
                  max={95}
                  value={Math.round(config.prize_pool_pct * 100)}
                  onChange={(e) => update('prize_pool_pct', Number(e.target.value) / 100)}
                />
                <span className="admin-range-value">{Math.round(config.prize_pool_pct * 100)}%</span>
              </div>
            </div>
            <div className="form-group admin-field admin-field--checkbox">
              <label htmlFor="cfg-boost-on">
                <input
                  id="cfg-boost-on"
                  type="checkbox"
                  checked={config.boost_enabled}
                  onChange={(e) => update('boost_enabled', e.target.checked)}
                />
                <span>Буст включён</span>
              </label>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-boost-cost">Стоимость буста</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-boost-cost"
                  type="range"
                  className="admin-range-input"
                  min={50}
                  max={1000}
                  step={50}
                  value={config.boost_cost}
                  onChange={(e) => update('boost_cost', Number(e.target.value))}
                />
                <span className="admin-range-value">{config.boost_cost}</span>
              </div>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-boost-mult">Множитель буста (%)</label>
              <div className="admin-slider-row">
                <input
                  id="cfg-boost-mult"
                  type="range"
                  className="admin-range-input"
                  min={10}
                  max={50}
                  value={Math.round(config.boost_multiplier * 100)}
                  onChange={(e) => update('boost_multiplier', Number(e.target.value) / 100)}
                />
                <span className="admin-range-value">{Math.round(config.boost_multiplier * 100)}%</span>
              </div>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-bot">Поведение при победе бота</label>
              <select id="cfg-bot" value={config.bot_win_policy} onChange={(e) => update('bot_win_policy', e.target.value as AdminConfig['bot_win_policy'])}>
                <option value="return_pool">Вернуть в призовой пул</option>
                <option value="burn">Списать (сжигание)</option>
              </select>
            </div>
          </>
        )}

        {adminTab === 'bank' && (
          <>
            <div className="section-title-row compact">
              <h3>Bank — подбор комнаты по умолчанию</h3>
              <span className="section-note">Стартовые значения для полей «Цена входа» и «Места» в игре Bank</span>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-bank-fee">Цена входа по умолчанию</label>
              <input
                id="cfg-bank-fee"
                type="number"
                className="admin-number-input"
                min={1}
                value={config.bank_filter_entry_fee ?? 100}
                onChange={(e) => update('bank_filter_entry_fee', Number(e.target.value))}
              />
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-bank-seats">Мест за столом по умолчанию</label>
              <input
                id="cfg-bank-seats"
                type="number"
                className="admin-number-input"
                min={2}
                max={10}
                value={config.bank_filter_seats ?? 6}
                onChange={(e) => update('bank_filter_seats', Number(e.target.value))}
              />
            </div>
          </>
        )}

        {adminTab === 'mountain' && (
          <>
            <div className="section-title-row compact">
              <h3>Mountain — ставки по умолчанию</h3>
              <span className="section-note">Подставляются при создании комнаты в игре Mountain</span>
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-mt-min">Минимальная ставка</label>
              <input
                id="cfg-mt-min"
                type="number"
                className="admin-number-input"
                min={10}
                value={config.mountain_min_bet ?? 50}
                onChange={(e) => update('mountain_min_bet', Number(e.target.value))}
              />
            </div>
            <div className="form-group admin-field">
              <label htmlFor="cfg-mt-max">Максимальная ставка</label>
              <input
                id="cfg-mt-max"
                type="number"
                className="admin-number-input"
                min={10}
                value={config.mountain_max_bet ?? 400}
                onChange={(e) => update('mountain_max_bet', Number(e.target.value))}
              />
            </div>
          </>
        )}

        <div className="risk-indicator">
          <span className={`risk-level ${validation?.risk_level || 'LOW'}`}>{riskLabel}</span>
          {validationIssues.length > 0 ? (
            <ul className="risk-warnings">
              {validationIssues.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="section-note">{validation?.explanation || 'Настройки выглядят допустимыми.'}</p>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={!validation?.can_save}
          onClick={async () => {
            try {
              await api.saveConfig(config)
              toast('Конфигурация сохранена', 'success')
            } catch (e) {
              toast((e as Error).message, 'error')
            }
          }}
        >
          Сохранить настройки вкладки
        </button>
      </div>
    </section>
  )
}
