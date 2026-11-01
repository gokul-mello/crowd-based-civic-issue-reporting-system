import os
import json
import re
import requests
from typing import Dict, Any

def generate_fallback_complaint(description: str, category_hint: str = 'Other', area_hint: str = '') -> Dict[str, Any]:
    clean = (description or '').strip()
    text_lower = clean.lower()
    category = category_hint if category_hint and category_hint != 'Other' else 'Other'
    urgency = 'Medium'

    if re.search(r'pothole|road|crater|asphalt|traffic lane|pavement', text_lower):
        category = 'Roads & Potholes'
        if re.search(r'accident|injury|deadly|danger|major hole|deep', text_lower):
            urgency = 'High'
    elif re.search(r'garbage|trash|waste|dump|smell|stench|litter', text_lower):
        category = 'Garbage & Sanitation'
        if re.search(r'health hazard|disease|mosquito|hospital', text_lower):
            urgency = 'High'
    elif re.search(r'water leak|pipe burst|no water|low pressure|contamination|pipeline', text_lower):
        category = 'Water Supply & Leakage'
        if re.search(r'burst|flooding|drinking water|contaminated', text_lower):
            urgency = 'High'
    elif re.search(r'light|streetlight|dark|pole|wire|spark|lamp', text_lower):
        category = 'Streetlights & Electrical'
        if re.search(r'spark|live wire|shock', text_lower):
            urgency = 'Critical'
    elif re.search(r'drain|sewer|gutter|manhole|overflow|clog', text_lower):
        category = 'Drainage & Sewage'
        if re.search(r'overflow|submerged|open manhole', text_lower):
            urgency = 'High'
    elif re.search(r'park|bench|wall|compound|public property|bus stop', text_lower):
        category = 'Public Property & Parks'

    location_phrase = f" in the vicinity of {area_hint}" if area_hint else ""
    title = f"Urgent Civic Intervention Request: {category}{location_phrase}"

    if category == 'Roads & Potholes':
        title = f"Request for Urgent Road Surface Repair & Pothole Rectification{location_phrase}"
    elif category == 'Garbage & Sanitation':
        title = f"Civic Petition for Clearance of Accumulated Solid Waste{location_phrase}"
    elif category == 'Water Supply & Leakage':
        title = f"Notice of Water Distribution Disruption and Pipeline Leakage{location_phrase}"
    elif category == 'Streetlights & Electrical':
        title = f"Notice of Non-Functional Street Lighting and Safety Hazard{location_phrase}"
    elif category == 'Drainage & Sewage':
        title = f"Urgent Redressal for Blocked Sewage Drainage and Overflow{location_phrase}"

    area_part = f" ({area_hint})" if area_hint else ""
    formal_text = (
        f"To the Concerned Municipal Authority,\n\n"
        f"I am writing to formally submit a community civic grievance regarding the issue reported as follows: \"{clean}\".\n\n"
        f"This condition poses serious inconvenience to residents and pedestrians in the sector{area_part}, "
        f"hindering normal public transit and raising public sanitation/safety concerns. "
        f"The community respectfully petitions the municipal engineering and sanitation departments to dispatch an inspection team, "
        f"assess the ground circumstances, and execute remedial repairs at the earliest availability.\n\n"
        f"Thank you for your prompt dedication to public welfare."
    )

    return {
        "professionalTitle": title,
        "professionalDescription": formal_text,
        "suggestedCategory": category,
        "suggestedUrgency": urgency,
        "aiProvider": "CivicHeuristic-Engine (Fallback Mode)",
        "isFallback": True,
        "confidenceScore": 0.88,
        "disclaimer": "Generated using Rule-Based Civic Heuristics (AI API key not configured or offline)."
    }

def generate_professional_complaint(original_description: str, category: str = None, area: str = None) -> Dict[str, Any]:
    api_key = os.getenv("AI_API_KEY", "").strip()
    provider = os.getenv("AI_PROVIDER", "gemini").lower()

    if not api_key or "your_" in api_key.lower() or api_key == "YOUR_API_KEY":
        return generate_fallback_complaint(original_description, category or 'Other', area or '')

    try:
        system_prompt = (
            "You are a municipal civil affairs assistant. Transform the following citizen complaint into an official, polite, and professionally articulated civic grievance addressed to municipal authorities.\n"
            "Strict Rules:\n"
            "1. Preserve all factual claims and meaning exactly.\n"
            "2. DO NOT invent dates, names, injuries, addresses or facts not mentioned in the citizen prompt.\n"
            "3. Improve grammar, tone, professionalism and clarity.\n"
            "4. Return ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "professionalTitle": "Short, authoritative title under 15 words",\n'
            '  "professionalDescription": "2 to 3 paragraphs of formal complaint text",\n'
            '  "suggestedCategory": "One of: Roads & Potholes, Garbage & Sanitation, Water Supply & Leakage, Streetlights & Electrical, Drainage & Sewage, Public Property & Parks, Traffic & Safety, Other",\n'
            '  "suggestedUrgency": "One of: Low, Medium, High, Critical"\n'
            "}\n\n"
            f'Citizen description: "{original_description}"\n'
            f'Category hint: "{category or "Unspecified"}"\n'
            f'Area hint: "{area or "Unspecified"}"'
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": system_prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            raw_text = data['candidates'][0]['content']['parts'][0]['text']
            clean_json = raw_text.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(clean_json)
            return {
                "professionalTitle": parsed.get("professionalTitle", "Formal Civic Issue Grievance"),
                "professionalDescription": parsed.get("professionalDescription", original_description),
                "suggestedCategory": parsed.get("suggestedCategory", category or "Other"),
                "suggestedUrgency": parsed.get("suggestedUrgency", "Medium"),
                "aiProvider": "Google Gemini 1.5 Flash",
                "isFallback": False,
                "confidenceScore": 0.98,
                "disclaimer": "Processed by Gemini AI Model. Please review and edit before submitting."
            }
    except Exception as e:
        print(f"[AI] Error in LLM call: {e}")

    return generate_fallback_complaint(original_description, category or 'Other', area or '')
