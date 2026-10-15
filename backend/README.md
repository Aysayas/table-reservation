# LavaLust API Template

A backend-only JSON API starter built on [LavaLust](https://github.com/ronmarasigan/LavaLust) 4.7.0, with a
Docker setup for local development and a Render Blueprint for deployment. It uses PHP 8.5 with Apache and MySQL 8.

- **Local:** `docker compose` runs the app, MySQL and phpMyAdmin.
- **Production:** `render.yaml` deploys the same image to Render, using an external MySQL host (for example Aiven).

## Documentation

| Document | Purpose |
|---|---|
| [QUICKSTART.md](QUICKSTART.md) | Fastest path from clone to a running API, daily commands, troubleshooting |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Services, environment variables, migrations, TLS, Render deployment |

## Quick Start

On Windows, with Docker Desktop running:

```powershell
git clone https://github.com/Aysayas/Lavalust-Template.git my-new-project
cd my-new-project
.\setup-new-project.bat
```

Then check the API:

```bash
curl http://localhost/health
# {"status":"ok","db":"ok"}
```

See [QUICKSTART.md](QUICKSTART.md) for what the setup script does and for the daily workflow.

## Project Layout

```
.
├── app/
│   ├── config/          # api.php, config.php, database.php, migration.php, routes.php
│   ├── controllers/     # Health.php, Migrate.php, plus your controllers
│   ├── commands/        # MigrationCommand.php (php lava migration ...)
│   ├── kernel/          # MY_Database.php, MY_Errors.php
│   ├── migrations/      # Schema migrations (000_, 001_, 002_ ...)
│   ├── models/
│   └── views/
├── public/              # Web root (Apache DocumentRoot); index.php is the entry point
├── scheme/              # LavaLust core (upstream, do not modify)
├── runtime/             # Cache and logs (must be writable)
├── Dockerfile           # Upstream image: PHP 8.5 + Apache
├── docker-compose.yml   # app, mysql, phpmyadmin
├── render.yaml          # Render Blueprint
├── .env.example         # Template for .env (copy, or let the scripts create it)
└── *.ps1 / *.bat        # Setup and daily start/stop scripts
```

## What Differs From Upstream

Everything not listed here is stock LavaLust 4.7.0 (upstream commit `74045f1`). `scheme/`, `console/`,
`public/`, `lava`, `Dockerfile`, `.htaccess`, `changelog.txt` and the stock files in `app/` are unmodified.

The template adds these:

1. **`app/kernel/MY_Database.php`**: enables MySQL TLS when `DB_SSL_CA` is set (required by managed hosts such as Aiven).
2. **`app/kernel/MY_Errors.php`**: outside `APP_ENV=development`, unhandled errors return a generic
   `{"error":"Internal server error","status":500}`; details go only to the PHP log. Under the CLI, the
   message goes to STDERR and the process exits with code 1.
3. **`app/controllers/Health.php`**: `GET /health` runs `SELECT 1` and returns `{"status":"ok","db":"ok"}`.
4. **`app/controllers/Migrate.php` and `app/commands/MigrationCommand.php`**: `php lava migration run|rollback|status`.
   The migration routes are registered only under the CLI, so they are not reachable over HTTP.
5. **Config edits:**
   - `database.php`: `ssl_ca` and `ssl_verify`, read from the environment.
   - `api.php`: `api_helper_enabled` set to `TRUE`.
   - `migration.php`: enabled only for the CLI.
   - `routes.php`: `/health` and the CLI migration routes.
   - `config.php`: `security_headers` CORS origin from `CORS_ALLOW_ORIGIN`, and `trust_proxy` from `TRUST_PROXY`.

## Configuration

All settings come from `.env`. LavaLust reads that file itself, and values in `.env` override real
environment variables. The file is git-ignored and excluded from the Docker image. Variables are described in
[DOCKER_SETUP.md](DOCKER_SETUP.md#environment-variables).

Secrets have no defaults in code:

- `APP_KEY`, generated with `php lava key:generate`
- `JWT_SECRET` and `REFRESH_TOKEN_KEY`, at least 32 characters each (`init-env.ps1` fills them)

## Migrations

Migrations live in `app/migrations/` and run only from the CLI:

```bash
docker compose exec app php lava migration run
docker compose exec app php lava migration status
docker compose exec app php lava migration rollback   # undoes only the latest migration
```

## Building Endpoints

Controllers load the Api library and use its helpers. `GET /health` is a working example.

```php
<?php

class Users extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->call->library('api');
    }

    public function index()
    {
        $this->api->require_method('GET');
        $this->api->require_jwt();

        handle_cors();

        // Load your own model here, e.g. $this->call->model('User_model');
        $this->api->respond(['data' => []]);
    }
}
```

Register the route in `app/config/routes.php`:

```php
$router->get('/api/users', 'Users::index');
```

CORS headers are sent only by API code that calls `handle_cors()`. Setting `CORS_ALLOW_ORIGIN` alone does not add them to every response.

## Upgrading LavaLust

Upstream files are unmodified, so an upgrade means copying a newer upstream release over them:

1. Replace `scheme/`, `console/`, `public/`, `lava`, `Dockerfile`, `.htaccess`, `changelog.txt` and the stock files in `app/` with the new release.
2. Re-apply the files listed in [What Differs From Upstream](#what-differs-from-upstream) if the new release changes them.
3. Run `docker compose up -d --build` and `docker compose exec app php lava migration status`.

## Upstream CLI Notes

The upstream CLI also provides `php lava key:generate`, `php lava jwt:generate`, and `make:controller`,
`make:model` and similar generators. One quirk: `php lava make:controller` writes to `app/Controllers`
(capital C). On Linux, which the Docker image is, move the file to `app/controllers`.

## Links

- LavaLust: https://github.com/ronmarasigan/LavaLust
- LavaLust documentation: https://lavalust.netlify.app
- [QUICKSTART.md](QUICKSTART.md) and [DOCKER_SETUP.md](DOCKER_SETUP.md) in this repository
