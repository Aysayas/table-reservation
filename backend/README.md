# Backend

LavaLust (PHP 8.3) JSON API with MySQL 8. Started from the lead's [Lavalust-Template](https://github.com/Aysayas/Lavalust-Template) and adapted for this project: API only, no server-rendered pages. Framework docs: [lavalust.netlify.app](https://lavalust.netlify.app).

## Run locally (Docker)

Needs [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```bash
cd backend
cp .env.example .env
docker compose up -d
```

Or double-click `start-dev.bat` (and `stop-dev.bat` to stop).

| Service | URL |
|---|---|
| API | http://localhost:8000/api/health |
| Database check | http://localhost:8000/api/health/db |
| phpMyAdmin | http://localhost:8080 |
| MySQL | `localhost:3306`, user `table_reservation_user`, password `table_reservation_pass` |

The first start creates every table from `database/schema.sql`, then fills them with `database/seed.sql` (the same placeholder records as `frontend/src/services/sampleData.ts`). Both run only when the database volume is empty. To rebuild the database from scratch (this deletes all data):

```bash
docker compose down -v
docker compose up -d
```

Seeded logins, all with the dev-only password `devpass123`:

| Role | Email |
|---|---|
| admin | `admin@placeholder-domain.com` |
| staff | `staff@placeholder-domain.com` |
| kitchen | `kitchen@placeholder-domain.com` |

Never import `seed.sql` into a production database: anyone who reads this README could log in as admin.

Set `JWT_SECRET` and `JWT_REFRESH_KEY` in `.env` to random values before using login:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

## Folder guide

| Path | What it's for |
|---|---|
| `app/config/routes.php` | Every API URL, grouped under `/api` |
| `app/controllers/` | One controller per feature (`Health.php` is the example) |
| `app/models/` | Database queries per table |
| `app/config/api.php` | JWT, CORS and rate limit settings (values come from `.env`) |
| `database/schema.sql` | All tables from the ERD (`../docs/design/ERD.pdf`) |
| `docker/` | PHP, nginx and MySQL config for Docker and Render |
| `scheme/` | LavaLust core. Don't edit |

## Adding an endpoint

1. Add the route in `app/config/routes.php` inside the `api` group:

   ```php
   $router->get('/menu-items', 'Menu::index');
   ```

2. Create the controller and load the `api` library in its constructor. That handles CORS, preflight requests and JSON output:

   ```php
   class Menu extends Controller {
       public function __construct()
       {
           parent::__construct();
           $this->call->library('api');
           $this->call->database();
       }

       public function index()
       {
           $items = $this->db->table('menu_items')->where('is_available', 1)->get_all();
           $this->api->respond(['data' => $items]);
       }
   }
   ```

3. For staff and admin endpoints, call `$this->api->require_jwt();` first.

Tell the frontend developer the URL and JSON shape, and update `../docs/api.md`.

## Deploying to Render

The repo root has `render.yaml` (a Render Blueprint) that builds this folder with Docker.

1. Render dashboard → **New → Blueprint** → pick this repo.
2. Render generates `APP_KEY`, `JWT_SECRET` and `JWT_REFRESH_KEY`. Fill in the others:
   - `APP_URL`: the Render URL, e.g. `https://table-reservation-api.onrender.com`
   - `CORS_ORIGINS`: the frontend URL(s), comma separated
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: from your MySQL host
3. Render has no MySQL of its own. Create one on a MySQL host (e.g. Aiven or TiDB Cloud), then import `database/schema.sql` into it.
4. Check `https://<your-service>.onrender.com/api/health` and `/api/health/db`.

Only changes inside `backend/` trigger a redeploy. The free plan sleeps after about 15 minutes idle, and the first request after that takes up to a minute.
