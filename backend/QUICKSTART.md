# Quick Start

The fastest path from a fresh clone to a running API on Windows with Docker Desktop.
For details see [DOCKER_SETUP.md](DOCKER_SETUP.md).

## 1. Clone

Give the folder a name at clone time. The setup script renames things inside the project, not the folder itself.

```powershell
git clone https://github.com/Aysayas/Lavalust-Template.git my-new-project
cd my-new-project
```

## 2. Run Setup (once)

Double-click `setup-new-project.bat`, or run `.\setup-new-project.ps1`. It:

- asks for the project name and renames the `lavalust_` prefix in `.env.example` (database name and user)
- backs up an existing `.env` to `.env.bak` and creates a new one, with generated keys and passwords
- optionally resets git history and sets a new remote
- runs `docker compose up -d --build --wait`, then the migrations
- opens VS Code and `http://localhost/health`

The `.bat` and `.ps1` files delete themselves after a successful run.

## 3. Verify

```bash
curl http://localhost/health
# {"status":"ok","db":"ok"}
```

```bash
docker compose exec app php lava migration status
```

## Daily Commands

| Task | Command |
|---|---|
| Start | `.\start-dev.bat` (or `.\start.ps1`): creates `.env` if missing, starts containers, runs migrations |
| Stop (keeps data) | `.\stop-dev.bat` or `docker compose down` |
| Run migrations | `docker compose exec app php lava migration run` |
| Roll back last migration | `docker compose exec app php lava migration rollback` |
| View app logs | `docker compose logs -f app` |
| Reset database (deletes data) | `docker compose down -v`, then start again |

## Local URLs

| Service | URL |
|---|---|
| API | http://localhost (`APP_PORT`) |
| Health check | http://localhost/health |
| phpMyAdmin | http://127.0.0.1:8080 (`PMA_PORT`), log in with `DB_USER` / `DB_PASSWORD` |
| MySQL | 127.0.0.1:3306 (`DB_FORWARD_PORT`) |

All ports bind to 127.0.0.1 only.

## Troubleshooting

| Problem | Fix |
|---|---|
| Port already in use | Set `APP_PORT`, `DB_FORWARD_PORT` or `PMA_PORT` in `.env` to free ports, then run `docker compose up -d` again |
| `/health` returns 500 | Check `JWT_SECRET` and `REFRESH_TOKEN_KEY` (at least 32 characters) and the `DB_*` values in `.env`. Then run `docker compose logs app`. The error text is in the PHP log, not the response |
| `/health` fails right after start | MySQL may still be starting. Wait a few seconds and retry |
| Changed `DB_PASSWORD` but MySQL rejects it | The MySQL volume keeps the old password. Run `docker compose down -v` (deletes data), then start again |
| Compose says a variable is required | `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER` or `DB_PASSWORD` is empty in `.env`. Run `.\init-env.ps1` or fill it in |
| Docker command not found | Install and start Docker Desktop |
