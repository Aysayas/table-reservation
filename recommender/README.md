# Recommender

A small Python service (FastAPI) that suggests dishes. The backend calls it from `GET /api/recommendations`; the frontend never calls it directly.

## How it picks dishes

- It reads the last 180 days of orders (`orders`, `order_items`) and the menu (`menu_items`, with each dish's category), and keeps them in memory for 5 minutes.
- **Often ordered together:** for each dish in the request, it counts the orders that also had another dish, weighted by how popular both dishes are (cosine similarity), and adds the scores up.
- **Recent orders count more:** each order's weight halves every 30 days, so what guests order now outranks what sold months ago.
- **Variety:** the list skips a category it already has, or one already in the guest's dishes (a pizza in the cart brings a drink or a dessert first). Same-category dishes fill the list only when nothing else is left.
- The rest of the list is filled with the most-ordered dishes, then with the other flagged dishes by ID.
- Only dishes that are available and have "Show in Recommendations" (`is_recommended`) on are suggested, never the dishes sent in.
- The logic is in `engine.py`, with tests in `test_engine.py`.

## API

- `GET /health`: `{"status": "ok"}`
- `POST /recommend` with header `X-Recommender-Secret` and body `{"item_ids": [1, 10], "limit": 4}` (up to 50 IDs, limit 1–12): `{"item_ids": [...], "source": "together" | "popular" | "flagged"}`. 401 without the right secret, 422 for bad input.

## Environment

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_CA` (path to the CA file; empty means no SSL), `RECOMMENDER_SECRET` (shared with the backend).

On production it uses its own read-only MySQL user, with `SELECT` on `orders`, `order_items` and `menu_items` only.

## Run it

- Tests: `pip install -r requirements-dev.txt`, then `python -m pytest -q`.
- With the local Docker backend: `cd backend`, `docker compose --profile recommender up -d`, then in `backend/.env` set `RECOMMENDER_URL=http://recommender:8001` and `RECOMMENDER_SECRET=local-recommender-secret`, and restart php.
- On Render: the second service in `render.yaml` (Python, free plan). It sleeps when idle; the backend then answers with best sellers instead.
