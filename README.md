# FSP Casino — единая платформа мини-игр

Монорепозиторий: **Java Spring Boot** (общий бэкенд, кошелёк, JWT), встроенный **Opencase** (React), вложенные сборки **Mountain** и **Bank**, опционально **Python**-сервис для Opencase (`kazik-game`) при локальной разработке без Java.

## Структура

| Каталог | Назначение |
|--------|-------------|
| [`FSP-backend-casino/`](FSP-backend-casino/README.md) | Maven multi-module: API, WebSocket, Docker Compose, статика в `casino-app/src/main/resources/static/` |
| [`kazik-game/`](kazik-game/RUNNING.md) | Opencase: Python API + React SPA (сборка может подкладываться в Java `static/`) |
| [`external-games/`](external-games/) | Исходники **Mountain** и **Bank** (Vite); после `npm run build` — копировать в `static/mountain` и `static/bank` |

## Быстрый старт (только Docker, рекомендуется)

```bash
cd FSP-backend-casino/backend
cp .env.example .env
# Задайте JWT_SECRET ≥ 32 символов

docker compose up --build
```

- Приложение: http://localhost:8080  
- Opencase SPA: `/`  
- Mountain: `/mountain/`  
- Bank: `/bank/`  
- Swagger: `/swagger-ui`  

Подробности, тестовые пользователи и API: [**FSP-backend-casino/README.md**](FSP-backend-casino/README.md).

## Обновление фронтендов в Java `static/`

**Не** копируйте `rsync --delete` из корня `dist/` в `static/`, если в `static/` уже есть подпапки `mountain/`, `bank/`, `instruct_photos/` — они будут удалены.

Рекомендуемый порядок:

1. **Opencase (корневой SPA):**  
   `cd kazik-game/frontend-react && npm run build`  
   затем скопируйте только **`dist/index.html`** и **`dist/assets/`** в `FSP-backend-casino/backend/casino-app/src/main/resources/static/`.

2. **Mountain / Bank:**  
   `npm run build` в соответствующей папке `external-games/...`, затем синхронизация **только** в `static/mountain/` и `static/bank/`.

3. Пересоберите Docker-образ бэкенда: `docker compose build backend`.

## Локальная разработка Opencase (React + Python)

См. [**kazik-game/RUNNING.md**](kazik-game/RUNNING.md) и переменные `VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET` в `kazik-game/frontend-react`.

## Лицензия

См. [LICENSE](LICENSE).
