"""Duplicate detection: Jaccard token similarity + Haversine distance."""
import math
import re

STOP = set("the a an is are of in on at to and for near with this that it there has have was our very".split())


def tokens(text):
    return {w for w in re.findall(r"[a-z]{3,}", (text or "").lower()) if w not in STOP}


def jaccard(a, b):
    a, b = tokens(a), tokens(b)
    return len(a & b) / len(a | b) if a and b else 0.0


def haversine_m(lat1, lon1, lat2, lon2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def find_duplicates(text, category, lat=None, lng=None, limit=5):
    from complaints.models import Complaint
    out = []
    qs = Complaint.objects.exclude(status__in=["resolved", "rejected"])
    for c in qs:
        sim = jaccard(text, f"{c.title} {c.description}")
        dist = None
        if lat is not None and lng is not None and c.latitude is not None:
            dist = haversine_m(lat, lng, c.latitude, c.longitude)
        near = dist is not None and dist <= 200
        if (sim >= 0.35) or (near and c.category == category and sim >= 0.1):
            out.append({"id": c.id, "title": c.title, "similarity": round(sim, 2),
                        "distance_m": round(dist) if dist is not None else None,
                        "votes": c.votes_count, "url": f"/complaints/{c.id}/"})
    return sorted(out, key=lambda d: -d["similarity"])[:limit]
