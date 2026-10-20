# Backend

LavaLust (PHP 8.3) JSON API with MySQL 8. Started from the lead's [Lavalust-Template](https://github.com/Aysayas/Lavalust-Template) and adapted for this project: API only, no server-rendered pages. Framework docs: [lavalust.netlify.app](https://lavalust.netlify.app).

## Run locally (Docker)

Needs [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```bash
cd backend
cp .env.example .env
docker compose up -d
```

Or double-click `start-dev.bat` (and `stop-dev.bat` to stop). It starts Docker and the containers, fills in missing JWT keys in `.env`, then shows a menu:

| Key | Does |
|---|---|
| 1 | Status: containers, `/api/health`, `/api/health/db` |
| 2 | Test API: calls every route in `app/config/routes.php`, expects 501 from stubs |
| 3 | Restart all containers |
| 4 | Follow container logs (new window) |
| 5 | MySQL shell (new window) |
| 6 | Bash inside the php container (new window) |
| 7 | Start the frontend dev server (new window), creating `frontend/.env.local` if missing |
| 8 | Frontend checks: format, build, lint, e2e tests |
| 9 | Reset DB: deletes all local data and reloads `schema.sql` + `seed.sql`. Asks you to type `RESET` |
| S | Stop all containers and exit |
| Q | Exit, leave everything running |

`DB_PASSWORD` in `.env` must match `MYSQL_PASSWORD` in `docker-compose.yml` (`table_reservation_pass`), or `/api/health/db` returns 503.

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

Every API route returns 500 "Refresh token key is missing or too weak." until `JWT_SECRET` and `JWT_REFRESH_KEY` in `.env` are at least 32 characters. `start-dev.bat` generates them. To make one by hand:

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
| `scheme/` | LavaLust core. Change only to fix a bug, and say so in the PR |

## Testing the database

With the containers running and `APP_ENV=development`, open these in the browser:

| URL | Shows |
|---|---|
| http://localhost:8000/dev/db | Every table, read through its model, as `ddt()` tables |
| http://localhost:8000/dev/db/crud | A create, read, update and delete test for every model, with PASS or FAIL per row |
| http://localhost:8000/dev/db/table/category | Test it yourself: forms to create, read, update and delete rows. Swap `category` for `user`, `customer`, `table`, `reservation`, `menu_item`, `order`, `order_item`, `payment`, `notification`, `setting` or `opening_hour` |

The table pages change the real local data, and foreign key or CHECK errors show on the page. To start over, use `start-dev.bat` option 9 (Reset DB). The CRUD test runs each model inside a transaction and rolls it back, so the seed data stays the same. The summary shows "row counts unchanged". The test data is the `$cases` list at the top of `app/controllers/Dbtest.php`. Add a row there when you add a model. Both pages return 404 unless `APP_ENV` is `development`, and Render sets it to `production`.

PHP caches files for up to 60 seconds (`opcache.revalidate_freq` in `docker/php/php.ini`). If a change doesn't show yet, run `docker compose restart php`.

## Built-in helpers

Use LavaLust's built-ins before writing your own:

| Need | Use |
|---|---|
| Request body or query | `$this->api->body()` (JSON or form, not escaped), `$this->api->get_query_params()`, `$this->request->json()`, `$this->request->post('field')` |
| Validation | `Form_validation`: `required`, `valid_email`, `numeric`, `greater_than[0]`, `max_length[100]`, `in_list[a,b]`. For "already taken" checks use Model `exists([...])`, because `is_unique` can't be used in a rules string |
| One row or many | Model `find`, `find_by`, `find_all_by`, `filter([...])->get_all()`, `order_by`, `exists([...])`, `count()`, `paginate($per_page, $page)` |
| Find or create (e.g. a customer by mobile number) | Model `first_or_create($match, $extra)` |
| Several writes that succeed or fail together | Model `transaction()`, `commit()`, `rollback()` |
| Image upload (menu item photo, logo) | `Upload` library: `allowed_mimes`, `max_size`, `encrypt_name`, `do_upload` |
| Auth | `$this->api->require_role(...)`, `require_jwt()`, `rate_limit($key, $max, $seconds)` |
| Debug output | `dd()`, `ddt()` (table), `ddj()` (JSON) |

Input isn't HTML-escaped on the way in. Save what the user typed, and escape on output. React does that already.

`Form_validation` reads `$_POST` only. To validate a JSON body:

```php
$input = $this->api->body();
$_POST = $input;
$this->call->library('form_validation');

if (!$this->form_validation->validate(['email' => 'required|valid_email', 'pax' => 'required|numeric|greater_than[0]'])) {
    $this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $this->form_validation->get_errors()], 422);
}
```

## Adding an endpoint

1. Add the route in `app/config/routes.php` inside the `api` group:

   ```php
   $router->get('/menu-items', 'Menu::index');
   ```

2. In the controller, load the `api` library and the database in the constructor. The `api` library handles CORS, preflight requests and JSON output. Then load the model for the table you need:

   ```php
   class Menu extends Controller {
       public function __construct()
       {
           parent::__construct();
           $this->call->library('api');
           $this->call->database();
           $this->call->model('Menu_item_model');
       }

       public function index()
       {
           $items = $this->Menu_item_model->with('category')->all();
           $this->api->respond(['data' => $items]);
       }
   }
   ```

   Every table except `refresh_tokens` has a model in `app/models/` named `Name_model`. The `api` library manages `refresh_tokens` itself. Each model sets its `$table`, `$primary_key` and `$fillable`. Watch for two LavaLust quirks:
   - `with()` only works with `all()`. `find()` ignores it and leaves it set for the next `all()` call, so for one record use `find()` and load the related row yourself.
   - A `belongs_to` relation with a NULL foreign key returns `false`. Send `null` to the frontend instead.

3. For staff, kitchen and admin endpoints, call `$this->api->require_role('staff', 'admin');` first, listing every role allowed. It returns 401 without a valid access token and 403 for the wrong role. Admin is not added automatically, so include `'admin'` wherever admin should get in. Use `require_jwt()` when any logged-in user is fine. The "Who" column in `../docs/api.md` decides which roles each route allows.

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
