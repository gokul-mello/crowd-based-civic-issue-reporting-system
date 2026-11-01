import math
import re
from typing import Dict, Any, List

CATEGORY_WEIGHTS = {
    'Streetlights & Electrical': 30,
    'Drainage & Sewage': 28,
    'Roads & Potholes': 25,
    'Water Supply & Leakage': 22,
    'Garbage & Sanitation': 20,
    'Traffic & Safety': 25,
    'Public Property & Parks': 15,
    'Other': 10
}

def calculate_priority(vote_count: int = 0, category: str = 'Other', created_at: str = None, suggested_urgency: str = 'Medium') -> Dict[str, Any]:
    category_score = CATEGORY_WEIGHTS.get(category, 15)
    
    if vote_count <= 5:
        vote_score = vote_count * 4
    elif vote_count <= 20:
        vote_score = 20 + (vote_count - 5) * 1.2
    else:
        vote_score = min(45, 38 + math.log10(max(1, vote_count)) * 4)

    # Age calculation
    diff_days = 0
    age_score = min(15, diff_days * 2.5)

    urgency_score = 5
    if suggested_urgency == 'Critical':
        urgency_score = 15
    elif suggested_urgency == 'High':
        urgency_score = 10
    elif suggested_urgency == 'Low':
        urgency_score = 2

    raw_total = round(category_score + vote_score + age_score + urgency_score)
    total_score = max(5, min(100, raw_total))

    priority_level = 'Low'
    if total_score >= 75:
        priority_level = 'Critical'
    elif total_score >= 50:
        priority_level = 'High'
    elif total_score >= 25:
        priority_level = 'Medium'

    priority_reason = (
        f"Priority Score {total_score}/100: Category weight ({category_score}pts), "
        f"{vote_count} community votes ({round(vote_score)}pts), "
        f"pending duration {diff_days}d ({round(age_score)}pts), and urgency factor ({urgency_score}pts)."
    )

    return {
        "priorityScore": total_score,
        "priorityLevel": priority_level,
        "priorityReason": priority_reason
    }

def tokenize(text: str = '') -> List[str]:
    cleaned = re.sub(r'[^\w\s]', '', (text or '').lower())
    return [w for w in cleaned.split() if len(w) > 3]

def calculate_jaccard(set_a: set, set_b: set) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return intersection / union if union > 0 else 0.0

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c)
