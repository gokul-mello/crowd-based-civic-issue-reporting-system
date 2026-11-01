"""Turns informal citizen text into a structured grievance.
Uses Google Gemini if GEMINI_API_KEY is set, otherwise an offline rule-based engine."""
import json
import re
import urllib.request
from django.conf import settings

KEYWORDS = {
    "roads": ["road", "pothole", "hole", "crack", "bus stop", "footpath", "pavement", "speed breaker"],
    "water": ["water", "pipe", "leak", "tap", "supply", "borewell", "tank"],
    "electricity": ["electric", "wire", "power", "transformer", "pole", "current", "voltage", "sparking"],
    "sanitation": ["garbage", "waste", "trash", "dump", "smell", "dustbin", "sweeping", "toilet"],
    "drainage": ["drain", "sewage", "sewer", "manhole", "overflow", "flood", "stagnant"],
    "streetlight": ["street light", "streetlight", "lamp", "dark", "light not"],
}
LABEL = {"roads": "Road damage", "water": "Water supply issue", "electricity": "Electrical hazard",
         "sanitation": "Sanitation and waste issue", "drainage": "Drainage problem",
         "streetlight": "Street light failure", "other": "Civic issue"}


def detect_category(text):
    t = text.lower()
    scores = {c: sum(t.count(k) for k in ks) for c, ks in KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def heuristic(text, address=""):
    clean = re.sub(r"\s+", " ", text).strip()
    cat = detect_category(clean)
    first = re.split(r"[.!?\n]", clean)[0][:80]
    place = f" at {address}" if address else ""
    title = f"{LABEL[cat]}{place}" if address else f"{LABEL[cat]}: {first}"
    desc = (f"Respected Sir/Madam,\n\nI wish to bring to the notice of the municipal authorities "
            f"the following issue{place}:\n\n{clean}\n\n"
            f"I request the concerned department to inspect the location and take necessary action "
            f"at the earliest.\n\nThank you.")
    return {"title": title[:150], "description": desc, "category": cat, "source": "heuristic"}


def generate(text, address=""):
    key = settings.GEMINI_API_KEY
    if key:
        try:
            prompt = ("Rewrite this citizen complaint as a formal civic grievance. Do NOT invent facts. "
                      "Return ONLY JSON with keys title, description, category (one of roads, water, "
                      f"electricity, sanitation, drainage, streetlight, other).\nLocation: {address}\nComplaint: {text}")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
            req = urllib.request.Request(url, body, {"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                raw = json.load(r)["candidates"][0]["content"]["parts"][0]["text"]
            data = json.loads(re.search(r"\{.*\}", raw, re.S).group(0))
            if data.get("category") not in LABEL:
                data["category"] = detect_category(text)
            return {"title": data["title"][:150], "description": data["description"],
                    "category": data["category"], "source": "gemini"}
        except Exception:
            pass  # fall back to offline engine
    return heuristic(text, address)
