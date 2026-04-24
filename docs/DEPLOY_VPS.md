# Развёртывание на VPS (Docker)

Руководство для Linux-сервера (Ubuntu/Debian), где приложение поднимается через **Docker Compose** из каталога `FSP-backend-casino/backend`, как в локальном сценарии.

## Предпосылки

- **ОС:** Ubuntu 22.04+ или аналог с systemd.
- **Ресурсы (минимум):** 2 vCPU, 2 ГБ RAM, 20 ГБ диск; для комфортной работы PostgreSQL + Redis + JVM — 4 ГБ RAM предпочтительнее.
- **Порты:** наружу обычно публикуют **80/443** (через reverse proxy); **8080** оставляют на loopback, если прокси на той же машине.

## 1. Установка Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# перелогин или newgrp docker
```

Проверка: `docker compose version`.

## 2. Клонирование и секреты

```bash
sudo mkdir -p /opt/fsp-casino
sudo chown "$USER:$USER" /opt/fsp-casino
cd /opt/fsp-casino
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> .
cd FSP-backend-casino/backend
cp .env.example .env
nano .env
```

**Обязательно** задайте уникальные значения:

| Переменная | Правило |
|------------|--------|
| `POSTGRES_PASSWORD` | длинный случайный пароль |
| `JWT_SECRET` | **≥ 32 символа**; для production сгенерируйте, например: `openssl rand -base64 48` |

Не коммитьте `.env` (он в `.gitignore`).

## 3. Сборка и запуск

```bash
docker compose up -d --build
```

- Приложение: `http://<IP_СЕРВЕРА>:8080`
- Health: `curl -sf http://127.0.0.1:8080/actuator/health`

Первый старт: Flyway применит миграции, поднимутся сиды (тестовые пользователи, см. [FSP-backend-casino/README.md](../FSP-backend-casino/README.md)).

Остановка и данные:

```bash
cd /opt/fsp-casino/FSP-backend-casino/backend
docker compose down      # остановка, том PostgreSQL сохраняется
docker compose down -v  # + удаление тома БД (полный сброс)
```

## 4. Сеть и безопасность

1. **Firewall (ufw):** открыть только `22` (SSH), `80`, `443`; **не** публиковать `5432` и `6379` в интернет.  
   Сейчас `docker-compose.yml` пробрасывает Postgres и Redis на `0.0.0.0` — на проде лучше:
   - либо убрать секции `ports` у `postgres` и `redis` (сервисы останутся доступны только внутри Docker-сети для `backend`);
   - либо биндить `127.0.0.1:5432:5432` только при необходимости бэкапов с хоста.

2. **HTTPS:** поставьте **Caddy** или **nginx** + Let’s Encrypt, проксируйте `https://ваш-домен` → `http://127.0.0.1:8080`. Spring уже отдаёт встроенный фронт и API с одного origin; при смене домена пересобирайте Vite-франт с нужным `VITE_API_BASE_URL`, если не используете тот же origin (см. ниже).

3. **Фронт и origin:** в прод-режиме SPA из JAR обычно кладёт `VITE_API_BASE_URL` как **пустую строку** или URL вашего публичного **https**-домена. Если весь трафик идёт с одного хоста (reverse proxy), достаточно `window.location.origin` — тогда **перекопирование** `static/` с правильной сборкой выполняйте **до** `docker compose build` на CI или на сервере.

## 5. Обновление релиза

```bash
cd /opt/fsp-casino
git pull
cd FSP-backend-casino/backend
docker compose up -d --build
```

Плановый даунтайм — секунды; миграции Flyway прогонятся при старте JVM.

## 6. Бэкапы

- **PostgreSQL:** `docker exec <postgres-container> pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip -c > backup.sql.gz` по cron.  
- Восстановление: развернуть пустой том, `gunzip` + `psql`.

## 7. Диагностика

| Симптом | Куда смотреть |
|---------|----------------|
| 502 / нет ответа | `docker compose ps`, логи `docker compose logs -f backend` |
| 500 на `/api/auth/login` | логи backend: `JWT_SECRET` слишком короткий (должно логироваться; в актуальном коде короткие строки нормализуются через SHA-256, но в prod всё равно задайте длинный секрет) |
| Нет сессии после F5 | убедитесь, что `GET /api/users/{id}/active-room` не 500; версия с `JOIN FETCH` для `Room` в [RoomParticipantRepository](../FSP-backend-casino/backend/casino-domain/src/main/java/ru/fsp/casino/domain/repository/RoomParticipantRepository.java) |

---

*Документ дополняет [FSP-backend-casino/README.md](../FSP-backend-casino/README.md) и [SECURITY.md](SECURITY.md).*
