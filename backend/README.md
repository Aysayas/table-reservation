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

Both services run in Render's **Singapore** region, next to the Aiven database (DigitalOcean Bangalore) and Pusher's `ap1` cluster. A Render service's region can't be changed later, so moving region means new services (new names in `render.yaml`).

1. Render dashboard → **New → Blueprint** → pick this repo.
2. Render generates `APP_KEY`, `JWT_SECRET` and `JWT_REFRESH_KEY`. Fill in the others:
   - `APP_URL`: the Render URL, e.g. `https://table-reservation-api.onrender.com`
   - `CORS_ORIGINS`: the frontend URL(s), comma separated
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: from your MySQL host
   - `DB_SSL_CA`: path to the host's CA certificate, e.g. `/etc/secrets/ca.pem` (add the file under Render → Environment → Secret Files). Leave it empty locally
3. Render has no MySQL of its own. Create one on a MySQL host (e.g. Aiven or TiDB Cloud). Do not import `schema.sql` or `seed.sql`: the container runs `php public/index.php migrate` on every start, which creates the tables (migration `001_initial_schema`). Create the first admin user by hand.
4. Check `https://<your-service>.onrender.com/api/health` and `/api/health/db`.

`render.yaml` sets `DB_SSL_CA=/etc/secrets/ca.pem`: add the host's CA certificate as a Secret File named `ca.pem` in the Render dashboard. The production image turns PHP `display_errors` off. Menu photos uploaded in production are lost on each deploy until cloud storage is added.

Frontend: Netlify reads `netlify.toml` at the repo root (base `frontend`, publish `dist`, all routes to `index.html`). Set `VITE_API_URL` to `https://<your-service>.onrender.com/api` in Netlify, then add that Netlify URL to `CORS_ORIGINS` on Render.

Only changes inside `backend/` trigger a redeploy. The free plan sleeps after about 15 minutes idle, and the first request after that takes up to a minute.

The PHP version is pinned in the `Dockerfile` (`php:8.3.36-fpm-alpine`). Bump it when PHP ships a security release.

## Migrations

- `database/schema.sql` is frozen as the baseline. Every later schema change is a new file in `app/migrations/` (`002_name.php`, class `Name`), plus the model `$fillable`, `frontend/src/types/db.ts` and `sampleData.ts`.
- `php public/index.php migrate` runs pending migrations; `migrate/status` lists them. Both are CLI only (HTTP gets a 404). In Docker: `docker compose exec php php public/index.php migrate`.
- Local Docker still loads `schema.sql` and `seed.sql` on a fresh volume, so run `migrate` afterwards to apply later migrations. `001` is safe to run on a database that already has the tables.
- `002_starting_data` copies the restaurant's settings, opening hours, categories, menu and tables from `seed.sql` into any of those tables that is still empty, with new random QR tokens. It never adds users, customers, reservations, orders or payments, so production starts with no logins: create the first admin by hand.

## Payments (PayMongo)

- `app/libraries/Paymongo.php` creates PayMongo Checkout Sessions and checks webhook signatures (`Paymongo-Signature`: HMAC-SHA256 of `t.raw_body` with the webhook secret; `te` for test events, `li` for live).
- Env: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `FRONTEND_URL` (the return pages). Render asks for them; locally they go in `.env`.
- **Fake mode:** with `PAYMONGO_SECRET_KEY` empty, no request goes to PayMongo; `checkout_url` is the return page and the payment stays `pending`. With `PAYMONGO_WEBHOOK_SECRET` empty, every webhook is refused (401).
- To simulate a paid webhook locally, set `PAYMONGO_WEBHOOK_SECRET` in `.env`, sign `t.body` with it (`openssl dgst -sha256 -hmac`) and POST the event to `/api/payments/webhook` with `Paymongo-Signature: t=<t>,te=<signature>,li=`.
- In the PayMongo dashboard, add a webhook for `checkout_session.payment.paid` pointing at `https://<your-service>.onrender.com/api/payments/webhook`, and copy its secret into `PAYMONGO_WEBHOOK_SECRET`.
- "needs a refund" lines in the logs mean a customer paid twice (an old tab, or cash plus online). Refund those in the PayMongo dashboard.

## Photos (Cloudinary)

- `app/libraries/Cloudinary.php` uploads menu photos and the logo after the `Upload` library has checked them (JPG or PNG, up to 2 MB, a real image). Signed uploads: sorted parameters, then the API secret, SHA-1. Files go to the folders `vencios-garden/menu` and `vencios-garden/logo`.
- Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary dashboard → API Keys).
- **Fake mode:** with any of them empty, files stay in `public/uploads/` as before (lost on every Render deploy).
- Replacing or deleting a photo also deletes the old one at Cloudinary (best effort; a failure is only logged).

## Live updates (Pusher)

- `app/libraries/Pusher.php` sends events over Pusher's REST API (HMAC-SHA256 signed, no SDK): `order.created` (new order), `order.status` (kitchen or staff moves it), `order.paid` (cash or online). Data is only `{ order_id, status, payment_status }`.
- Channels: `private-orders` for staff and kitchen (subscribing needs a staff, kitchen or admin token through `POST /api/realtime/auth`), and each table's `order-status-<hash of its QR token>` for the customer.
- Env: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`. The frontend needs only the key and cluster, which are public.
- **Fake mode:** without the keys, events are written to the log only. A Pusher failure is logged and never stops an order or a payment.

## SMS (fake mode)

- `app/libraries/Sms.php`: `reservation($id, $kind)` builds a fixed message (`booked`, `deposit_paid`, `cancelled`, `rescheduled`, `reminder`; plain characters and at most 160 for one SMS), sends it and saves a `notifications` row. Errors are logged and never stop a booking.
- No provider yet: `send()` only logs `SMS (fake mode) to …`. To connect one (for example Semaphore), replace the body of `send()` with the provider's API call and return true or false.
- Reminders: `POST /api/notifications/reminders` with `X-Cron-Secret` (env `CRON_SECRET`, generated by Render). `.github/workflows/reminders.yml` calls it every 15 minutes; put the same value in the GitHub repository secret `CRON_SECRET`. Each booking gets one reminder (`reservations.reminder_sent_at`), reset when it moves.
