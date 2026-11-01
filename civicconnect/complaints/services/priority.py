"""Transparent 0-100 priority score: category hazard + votes + aging + safety keywords."""
import math
from django.utils import timezone

CATEGORY_WEIGHT = {
    "electricity": 35, "drainage": 30, "roads": 25, "water": 25,
    "sanitation": 20, "streetlight": 18, "other": 10,
}
SAFETY_WORDS = ("live wire", "exposed wire", "electrocut", "accident", "injur", "open manhole",
                "open drain", "flood", "sparking", "collapse", "deep", "child", "danger")


def breakdown(c):
    base = CATEGORY_WEIGHT.get(c.category, 10)
    votes = min(25, round(8 * math.log1p(c.votes_count), 1))
    created = c.created_at or timezone.now()
    age = min(20, round((timezone.now() - created).days * 1.5, 1))
    text = f"{c.title} {c.description} {c.original_text}".lower()
    safety = 20 if any(w in text for w in SAFETY_WORDS) else 0
    return {"category": base, "votes": votes, "aging": age, "safety": safety}


def score(c):
    return min(100, round(sum(breakdown(c).values())))


def level(s):
    return "critical" if s >= 75 else "high" if s >= 55 else "medium" if s >= 35 else "low"
