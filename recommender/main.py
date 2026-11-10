import hmac
import os
import time

import pymysql
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from engine import recommend

CACHE_SECONDS = 300
HALF_LIFE_DAYS = 30
app = FastAPI(title="Vencio's Garden recommender", docs_url=None, redoc_url=None, openapi_url=None)
cache = {"at": 0.0, "orders": [], "weights": [], "candidates": [], "categories": {}}


class Request(BaseModel):
    item_ids: list[int] = Field(default_factory=list, max_length=50)
    limit: int = Field(default=4, ge=1, le=12)


def connect():
    ca = os.getenv("DB_SSL_CA", "")
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", ""),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", ""),
        connect_timeout=5,
        ssl_ca=ca or None,
        ssl_verify_cert=bool(ca),
        ssl_verify_identity=bool(ca),
    )


def load():
    if time.time() - cache["at"] < CACHE_SECONDS:
        return cache
    with connect() as db, db.cursor() as cursor:
        cursor.execute(
            "SELECT oi.order_id, oi.item_id, DATEDIFF(NOW(), o.created_at) FROM order_items oi"
            " JOIN orders o ON o.order_id = oi.order_id"
            " WHERE o.created_at >= NOW() - INTERVAL 180 DAY"
        )
        orders, ages = {}, {}
        for order_id, item_id, age in cursor.fetchall():
            orders.setdefault(order_id, set()).add(item_id)
            ages[order_id] = max(age or 0, 0)
        cursor.execute("SELECT item_id FROM menu_items WHERE is_available = 1 AND is_recommended = 1 ORDER BY item_id")
        candidates = [row[0] for row in cursor.fetchall()]
        cursor.execute("SELECT item_id, category_id FROM menu_items")
        categories = dict(cursor.fetchall())
    cache.update(
        at=time.time(),
        orders=list(orders.values()),
        weights=[0.5 ** (ages[order_id] / HALF_LIFE_DAYS) for order_id in orders],
        candidates=candidates,
        categories=categories,
    )
    return cache


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend")
def recommend_items(body: Request, x_recommender_secret: str = Header(default="")):
    secret = os.getenv("RECOMMENDER_SECRET", "")
    if not secret or not hmac.compare_digest(x_recommender_secret, secret):
        raise HTTPException(status_code=401, detail="Invalid secret")
    data = load()
    item_ids, source = recommend(
        data["orders"], data["candidates"], body.item_ids, body.limit, data["weights"], data["categories"]
    )
    return {"item_ids": item_ids, "source": source}
