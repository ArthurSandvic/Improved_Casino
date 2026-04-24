# Публикация в другой репозиторий / на другой GitHub-аккаунт

Сценарий: **этот** клон остаётся с текущим `origin`, а копия кода (или смена «дома») уходит **в отдельный** remote на **другом** аккаунте.

## Вариант A: второй remote, push только туда

1. На GitHub (или GitLab) под **вторым** аккаунтом создайте **пустой** репозиторий (без README, без `.gitignore` — иначе будет лишний merge commit при первом push).

2. Добавьте remote (имя `publish` — произвольное):

```bash
cd /path/to/opencase-bank
git remote add publish git@github.com:НОВЫЙ_АККАУНТ/НОВЫЙ_РЕПО.git
# или HTTPS:
# git remote add publish https://github.com/НОВЫЙ_АККАУНТ/НОВЫЙ_РЕПО.git
```

3. Проверка: `git remote -v` — должны быть и `origin`, и `publish`.

4. Вышлите ветку:

```bash
git push -u publish main
```

Следующие пуши: `git push publish main` (или настроьте `git config branch.main.remote publish` для ветки `main`).

`origin` при этом **не** меняется — `git push` по умолчанию по-прежнему туда, если `upstream` на `origin`.

## Вариант B: смена основного remote (оставить один URL)

```bash
git remote set-url origin git@github.com:НОВЫЙ_АККАУНТ/НОВЫЙ_РЕПО.git
git push -u origin main
```

Сохранить старый origin как `upstream`: `git remote add upstream <старый-url>`.

## SSH: два разных GitHub-аккаунта на одной машине

1. Создать отдельный ключ:  
   `ssh-keygen -t ed25519 -C "second@account" -f ~/.ssh/id_ed25519_second`

2. В `~/.ssh/config`:

```
Host github-second
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_second
```

3. **Public** ключ (`*.pub`) добавьте в GitHub → Settings → SSH keys (на втором аккаунте).

4. Remote:  
   `git remote add publish git@github-second:USER/REPO.git`

5. Проверка: `ssh -T git@github-second`.

## Персональные access token (HTTPS)

Если используете `https://github.com/...`, GitHub **не** принимает пароль: нужен **PAT** (classic или fine-grained) с правом `Contents: Write` на репозиторий. Сохраняйте токен в менеджере паролей, не в репозиторий.

## Перед пушем

- `git status` — нет лишнего: `.env`, `node_modules/`, `target/`.
- `grep -R "password\|secret" --include='.env' .` не должен находить закоммиченных секретов (только примеры в `.env.example`).

## Обновить ссылку в README

В корневом [README.md](../README.md) при желании поменяйте строку с URL репозитория на новый, чтобы клон по документации вёл на актуальное «доменное» имя проекта.
