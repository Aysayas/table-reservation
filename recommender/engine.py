from collections import Counter
from math import sqrt


def recommend(orders, candidates, item_ids, limit):
    chosen = set(item_ids)
    allowed = [item for item in candidates if item not in chosen]
    popularity = Counter(item for order in orders for item in order)

    together = Counter()
    for order in orders:
        if chosen & order:
            for item in order - chosen:
                for base in chosen & order:
                    together[item] += 1 / sqrt(popularity[base] * popularity[item])

    ranked = sorted(allowed, key=lambda item: (-together[item], -popularity[item], item))
    picks = ranked[:limit]

    if any(together[item] > 0 for item in picks):
        source = "together"
    elif any(popularity[item] > 0 for item in picks):
        source = "popular"
    else:
        source = "flagged"
    return picks, source
