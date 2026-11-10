from collections import Counter
from math import sqrt


def recommend(orders, candidates, item_ids, limit, weights=None, categories=None):
    chosen = set(item_ids)
    allowed = [item for item in candidates if item not in chosen]
    weights = weights or [1] * len(orders)
    categories = categories or {}

    popularity = Counter()
    for order, weight in zip(orders, weights):
        for item in order:
            popularity[item] += weight

    together = Counter()
    pairs = Counter()
    for order, weight in zip(orders, weights):
        if chosen & order:
            for item in order - chosen:
                for base in chosen & order:
                    score = weight / sqrt(popularity[base] * popularity[item])
                    together[item] += score
                    pairs[item, base] += score

    ranked = sorted(allowed, key=lambda item: (-together[item], -popularity[item], item))
    seen = {categories.get(item) for item in chosen} - {None}
    picks = []
    for item in ranked:
        category = categories.get(item)
        if len(picks) < limit and (category is None or category not in seen):
            picks.append(item)
            seen.add(category)
    picks += [item for item in ranked if item not in picks][: limit - len(picks)]

    if any(together[item] > 0 for item in picks):
        source = "together"
    elif any(popularity[item] > 0 for item in picks):
        source = "popular"
    else:
        source = "flagged"

    def reason(item):
        if together[item] > 0:
            base = max(chosen, key=lambda b: (pairs[item, b], -b))
            return {"type": "together", "with_item_id": base}
        return {"type": "popular" if popularity[item] > 0 else "pick"}

    return picks, source, [reason(item) for item in picks]
