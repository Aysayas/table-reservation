from engine import recommend

ORDERS = [{1, 2}, {1, 2}, {1, 3}, {4}, {4}, {4}, {4}, {5, 2}]
CANDIDATES = [1, 2, 3, 4, 5, 6]


def test_often_ordered_together_comes_first():
    picks, source = recommend(ORDERS, CANDIDATES, [1], 3)
    assert picks[0] == 2
    assert picks[1] == 3
    assert source == "together"


def test_never_suggests_what_is_already_chosen():
    picks, _ = recommend(ORDERS, CANDIDATES, [1, 2], 6)
    assert 1 not in picks and 2 not in picks


def test_only_candidates_are_suggested():
    picks, _ = recommend(ORDERS, [3, 6], [1], 5)
    assert picks == [3, 6]


def test_no_items_gives_popular_dishes():
    picks, source = recommend(ORDERS, CANDIDATES, [], 2)
    assert picks == [4, 1]
    assert source == "popular"


def test_no_orders_falls_back_to_flagged_items():
    picks, source = recommend([], CANDIDATES, [], 3)
    assert picks == [1, 2, 3]
    assert source == "flagged"


def test_limit_is_respected():
    picks, _ = recommend(ORDERS, CANDIDATES, [], 1)
    assert len(picks) == 1
