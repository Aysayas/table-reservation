# Docker and Render Setup

This document covers the local Docker stack, the environment variables, migrations, TLS to a managed MySQL
host, and deployment to Render. For the shortest path, see [QUICKSTART.md](QUICKSTART.md).

## Services

`docker-compose.yml` defines three services:

| Service | Image | Host port (127.0.0.1 only) | Purpose |
|---|---|---|---|
| `app` | Built from the upstream `Dockerfile` (PHP 8.5, Apache) | `${APP_PORT:-80}` | The API. Document root is `public/`. The project folder is bind-mounted at `/var/www/html` |
| `mysql` | `mysql:8.0` | `${DB_FORWARD_PORT:-3306}` | Database, with a health check. Data is kept in the `mysql_data` volume |
| `phpmyadmin` | `phpmyadmin:5.2` | `${PMA_PORT:-8080}` | Database admin UI |

Because the project folder is mounted, PHP code changes take effect without a rebuild. Rebuild only when the
`Dockerfile` or the PHP extensions change: `docker compose up -d --build`.

The MySQL container creates `DB_NAME` and the `DB_USER` account on first start. It does not create any tables.
Tables come from the migrations.

## Environment Variables

LavaLust reads `.env` itself. Values in `.env` override real environment variables. `.env` is never copied into
the image (`.dockerignore`) and is git-ignored.

Create `.env` with `init-env.ps1`, the start scripts, or by copying `.env.example`. The script fills only the
empty values in `APP_KEY`, `JWT_SECRET`, `REFRESH_TOKEN_KEY`, `DB_PASSWORD` and `DB_ROOT_PASSWORD`, so it is
safe to re-run.

| Variable | Default in `.env.example` | Description |
|---|---|---|
| `APP_NAME` | `Lavalust` | Application name |
| `APP_KEY` | empty (generated) | Application key. Generate with `php lava key:generate` |
| `APP_ENV` | `development` | `development` shows error details. `production` returns the generic JSON 500 and logs details |
| `DB_DRIVER` | `mysql` | Database driver |
| `DB_HOST` | `mysql` | Database host. `mysql` is the compose service name; use the managed host on Render |
| `DB_PORT` | `3306` | Database port. Managed hosts often use another port (Aiven does) |
| `DB_USER` | `lavalust_user` | Application database user |
| `DB_PASSWORD` | empty (generated) | Application database password |
| `DB_NAME` | `lavalust_db` | Database name |
| `DB_CHARSET` | `utf8mb4` | Connection charset |
| `DB_PREFIX` | empty | Table name prefix |
| `DB_SSL_CA` | empty | Path to the CA certificate file. Empty means no TLS |
| `DB_SSL_VERIFY` | `true` | Only the value `false` disables certificate verification |
| `JWT_SECRET` | empty (generated) | Signing key for JWTs. At least 32 characters |
| `REFRESH_TOKEN_KEY` | empty (generated) | Key for refresh tokens. At least 32 characters |
| `CORS_ALLOW_ORIGIN` | `http://localhost:3000` | Exact origin allowed to call the API. Empty means no CORS headers. Don't use `*` |
| `TRUST_PROXY` | `false` | Set `true` only behind a TLS-terminating proxy such as Render. Used for HSTS detection |
| `DB_ROOT_PASSWORD` | empty (generated) | Root password of the local MySQL container. Compose only |
| `APP_PORT` | `80` | Host port for the API. Compose only |
| `DB_FORWARD_PORT` | `3306` | Host port for MySQL. Compose only |
| `PMA_PORT` | `8080` | Host port for phpMyAdmin. Compose only |

The Api library refuses to load without `JWT_SECRET` and `REFRESH_TOKEN_KEY`. Without them, `/health` fails.

Compose requires `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`. It stops with an error if any is empty.

## Migrations

Migrations live in `app/migrations/` and run only from the CLI:

```bash
docker compose exec app php lava migration run        # apply pending migrations
docker compose exec app php lava migration status     # show applied and pending
docker compose exec app php lava migration rollback   # undo the latest migration only
```

The routes for these commands are registered only under the CLI, so they are not reachable over HTTP.

To add a table, create a new file in `app/migrations/` with the next number, then run `migration run`.

## Health Check

`GET /health` runs `SELECT 1` against the database:

```bash
curl http://localhost/health
# {"status":"ok","db":"ok"}
```

Render uses this endpoint as its health check path. If the database is unreachable, the response is an error,
and the details are written to the PHP log (`docker compose logs app`).

## TLS to a Managed MySQL Host

Local MySQL does not use TLS, so leave `DB_SSL_CA` empty. Managed hosts such as Aiven require TLS:

1. Download the CA certificate from the provider's console (for Aiven, `ca.pem`).
2. Set `DB_SSL_CA` to its path inside the container. Locally, put it in the project folder and use `/var/www/html/ca.pem`. Never commit it.
3. Keep `DB_SSL_VERIFY=true`. `MY_Database.php` uses the CA file to verify the server.

`*.pem` files are git-ignored, so the certificate is not committed.

## Logs and Errors

- `docker compose logs -f app` shows Apache and PHP output.
- With `APP_ENV=development`, errors return details in the response. Use this only locally.
- With any other `APP_ENV`, unhandled errors return `{"error":"Internal server error","status":500}`. The details
  go only to the PHP log.
- Under the CLI (for example `php lava migration run`), error messages go to STDERR and the exit code is 1.

## Daily Commands

| Task | Command |
|---|---|
| Start (creates `.env` if missing, builds, waits for healthy services, runs migrations) | `.\start-dev.bat` or `.\start.ps1` |
| Start without the script | `docker compose up -d --build --wait` |
| Stop, keep data | `.\stop-dev.bat` or `docker compose down` |
| Stop and delete the database | `docker compose down -v` |
| Shell in the app container | `docker compose exec app sh` |
| Open the MySQL client | `docker compose exec mysql mysql -u root -p` |

The start script prints the URLs using `APP_PORT` and `PMA_PORT` from `.env`.

## Upgrading Upstream LavaLust

See the section in [README.md](README.md#upgrading-lavalust). In short, copy a newer upstream release over
`scheme/`, `console/`, `public/`, `lava`, `changelog.txt` and the stock files in `app/`, then re-apply the
template files listed in the README if the release changes them.

## Deploying to Render

The repository includes `render.yaml`, a Render Blueprint. It builds the upstream `Dockerfile` as a single web
service on the free plan. Apache listens on port 80, and `PORT=80` is set for Render.

Render has no managed MySQL. Use an external host such as Aiven.

### Step by step

1. Push your project to GitHub. Confirm `.env` and `*.pem` are not in the commit.
2. Get the database details from your MySQL provider: host, port, database name, user and password.
3. If the provider requires TLS, download its CA certificate (for Aiven, `ca.pem`). Keep it on your machine.
4. In the Render dashboard, choose **New > Blueprint** and select the repository.
5. Render asks for the variables marked `sync: false`:
   - `CORS_ALLOW_ORIGIN`: the exact origin of your frontend, for example `https://app.example.com`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: from step 2
   - `DB_SSL_CA`: `/etc/secrets/ca.pem` if you use TLS, otherwise leave it empty
6. Render generates `APP_KEY`, `JWT_SECRET` and `REFRESH_TOKEN_KEY`. Do not set them by hand unless you need specific values.
7. If you use TLS, add the certificate to the service as a Render **Secret File** named `ca.pem`.
   Render mounts it at `/etc/secrets/ca.pem`, the path `DB_SSL_CA` points to.
8. Apply the Blueprint and wait for the first deploy.

### What happens on each deploy

The start command is `sh -c "php lava migration run && exec apache2-foreground"`. Pending migrations run before
Apache starts. If a migration fails, the deploy fails. Render's free plan has no Shell, so this is how tables
are created.

Render then checks `/health`. The service is live when that returns `{"status":"ok","db":"ok"}`.

### Check the deployment

```bash
curl https://<your-service>.onrender.com/health
# {"status":"ok","db":"ok"}
```

Set `DB_PORT` to the port your provider gives you. Aiven uses a non-standard port, not 3306.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `/health` returns 500 locally | Check `JWT_SECRET` and `REFRESH_TOKEN_KEY` (at least 32 characters) and the `DB_*` values. Then run `docker compose logs app` |
| `/health` returns 500 on Render | Check the deploy logs for the error. Usually `DB_HOST`, `DB_PORT`, `DB_PASSWORD` or `DB_SSL_CA` is wrong |
| Deploy fails during `migration run` | The migration or the database connection failed. Check the deploy log for the message and fix the database or the migration |
| TLS error connecting to the database | `DB_SSL_CA` is empty, the path is wrong, or the certificate is for another server. Confirm the path and the file |
| Port already in use | Another program uses the port. Set `APP_PORT`, `DB_FORWARD_PORT` or `PMA_PORT` in `.env` |
| `DB_PASSWORD` changed but MySQL rejects it | The MySQL volume keeps the password from first start. Run `docker compose down -v` (deletes data), then start again |
| Compose error about a missing variable | One of `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` is empty in `.env`. Run `.\init-env.ps1` |
| Changes to `Dockerfile` have no effect | Rebuild: `docker compose up -d --build` |
| CORS error in the browser | `CORS_ALLOW_ORIGIN` must match the frontend origin exactly, including scheme and port. The endpoint must call `handle_cors()` |
| Lost data after `down -v` | `down -v` deletes the MySQL volume. Use `docker compose down` to stop without deleting data |

## Files Not to Commit

`.env`, `.env.bak` and `*.pem` are git-ignored. Keep secrets out of the repository and in Render's environment
settings or Secret Files.
