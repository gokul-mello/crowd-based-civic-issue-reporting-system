import os
import json
import shutil
import re
import math
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import jwt, JWTError
from dotenv import load_dotenv
from db import db, new_id, now_iso
from services_algo import calculate_priority, tokenize, calculate_jaccard, calculate_distance
from ai_service import generate_professional_complaint
load_dotenv()
PORT = int(os.getenv("PORT", "5000"))
JWT_SECRET = os.getenv("JWT_SECRET", "civicconnect_super_secret_jwt_key_2026_secure")
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False
def create_access_token(user_id: str) -> str:
    payload = {"id": user_id}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("id")
        user = next((u for u in db.users if str(u.get("_id")) == str(user_id)), None)
        return user
    except Exception:
        return None
def get_current_user(request: Request) -> Dict[str, Any]:
    user = get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authorized, invalid token")
    return user
def require_role(role: str):
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail=f"Access denied: {role} role required")
        return user
    return role_checker
# App initialization
app = FastAPI(title="CivicConnect API (FastAPI)", version="2.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Notification Helper
def create_notification(recipient_id: str, complaint_id: str, title: str, message: str, notif_type: str):
    notif = {
        "_id": new_id(),
        "recipientId": str(recipient_id),
        "complaintId": str(complaint_id),
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "createdAt": now_iso()
    }
    db.notifications.insert(0, notif)
    db.save()

# ==========================================
# 1. Healthcheck
# ==========================================
@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "system": "CivicConnect API (FastAPI Python)",
        "timestamp": now_iso()
    }

# ==========================================
# 2. Authentication Routes
# ==========================================
class CitizenRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirmPassword: Optional[str] = None
    phone: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@app.post("/api/auth/register")
def register_citizen(data: CitizenRegisterRequest):
    name = (data.name or "").strip()
    email = (data.email or "").strip().lower()
    password = data.password or ""
    phone = (data.phone or "").strip()

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Please provide name, email, and password")

    if data.confirmPassword and password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = next((u for u in db.users if u.get("email", "").lower() == email), None)
    if existing:
        if existing.get("role") == "citizen":
            existing["passwordHash"] = hash_password(password)
            if name: existing["name"] = name
            if phone: existing["phone"] = phone
            db.save()
            token = create_access_token(str(existing["_id"]))
            return {
                "success": True,
                "message": "Citizen registered successfully",
                "token": token,
                "user": {
                    "id": existing["_id"],
                    "_id": existing["_id"],
                    "name": existing["name"],
                    "email": existing["email"],
                    "phone": existing["phone"],
                    "role": existing["role"]
                }
            }
        else:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = {
        "_id": new_id(),
        "name": name,
        "email": email,
        "phone": phone,
        "passwordHash": hash_password(password),
        "role": "citizen",
        "createdAt": now_iso()
    }
    db.users.append(new_user)
    db.save()

    token = create_access_token(str(new_user["_id"]))
    return {
        "success": True,
        "message": "Citizen registered successfully",
        "token": token,
        "user": {
            "id": new_user["_id"],
            "_id": new_user["_id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "phone": new_user["phone"],
            "role": new_user["role"]
        }
    }

@app.post("/api/auth/login")
def login_citizen(data: LoginRequest):
    email = (data.email or "").strip().lower()
    password = data.password or ""

    user = next((u for u in db.users if u.get("email", "").lower() == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("role") != "citizen":
        raise HTTPException(status_code=403, detail="This portal is for citizen accounts only. Authorities must use the Authority Login portal.")

    if not verify_password(password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user["_id"]))
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["_id"],
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "role": user["role"]
        }
    }

@app.post("/api/auth/authority/login")
def login_authority(data: LoginRequest):
    email = (data.email or "").strip().lower()
    password = data.password or ""

    user = next((u for u in db.users if u.get("email", "").lower() == email), None)
    if not user or user.get("role") != "authority":
        raise HTTPException(status_code=401, detail="Invalid authority credentials")

    if not verify_password(password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid authority credentials")

    dept = next((d for d in db.departments if str(d.get("_id")) == str(user.get("department"))), None)

    token = create_access_token(str(user["_id"]))
    return {
        "success": True,
        "message": "Authority authenticated successfully",
        "token": token,
        "user": {
            "id": user["_id"],
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "role": user["role"],
            "department": dept,
            "designation": user.get("designation", "Chief Municipal Officer")
        }
    }

@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    user_copy = {k: v for k, v in user.items() if k != "passwordHash"}
    user_copy["id"] = user_copy["_id"]
    if user_copy.get("department"):
        dept = next((d for d in db.departments if str(d.get("_id")) == str(user_copy["department"])), None)
        user_copy["department"] = dept
    return {"success": True, "user": user_copy}

@app.put("/api/auth/profile")
def update_profile(data: ProfileUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if data.name: user["name"] = data.name.strip()
    if data.phone is not None: user["phone"] = data.phone.strip()
    db.save()
    user_copy = {k: v for k, v in user.items() if k != "passwordHash"}
    user_copy["id"] = user_copy["_id"]
    return {"success": True, "message": "Profile updated successfully", "user": user_copy}

# ==========================================
# 3. Department Routes
# ==========================================
@app.get("/api/departments")
def get_departments():
    depts = sorted(db.departments, key=lambda d: d.get("name", ""))
    return {"success": True, "count": len(depts), "data": depts}

class DepartmentCreateRequest(BaseModel):
    name: str
    code: str
    description: str
    contactEmail: Optional[str] = ""
    contactPhone: Optional[str] = ""
    headOfficial: Optional[str] = ""

@app.post("/api/departments")
def create_department(data: DepartmentCreateRequest, user: Dict[str, Any] = Depends(require_role("authority"))):
    name = data.name.strip()
    code = data.code.strip().upper()
    existing = next((d for d in db.departments if d.get("code") == code or d.get("name").lower() == name.lower()), None)
    if existing:
        raise HTTPException(status_code=400, detail="Department with this code or name already exists")
    dept = {
        "_id": new_id(),
        "name": name,
        "code": code,
        "description": data.description.strip(),
        "contactEmail": data.contactEmail,
        "contactPhone": data.contactPhone,
        "headOfficial": data.headOfficial,
        "createdAt": now_iso()
    }
    db.departments.append(dept)
    db.save()
    return {"success": True, "message": "Department registered successfully", "data": dept}

# ==========================================
# 4. Complaint AI & Duplicate Services
# ==========================================
class AIComplaintRequest(BaseModel):
    originalDescription: str
    category: Optional[str] = None
    area: Optional[str] = None

@app.post("/api/complaints/generate-ai")
def generate_ai_complaint(data: AIComplaintRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if not data.originalDescription or len(data.originalDescription.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please provide at least 10 characters describing the problem.")
    result = generate_professional_complaint(data.originalDescription, data.category, data.area)
    return {"success": True, "data": result}

class CheckDuplicatesRequest(BaseModel):
    originalDescription: Optional[str] = ""
    category: Optional[str] = None
    area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@app.post("/api/complaints/check-duplicates")
def check_duplicates(data: CheckDuplicatesRequest, user: Dict[str, Any] = Depends(get_current_user)):
    candidates = [c for c in db.complaints if c.get("status") not in ["Resolved", "Rejected"]]
    if data.category:
        candidates = [c for c in candidates if c.get("category") == data.category]

    input_tokens = set(tokenize(data.originalDescription or ""))
    area_lower = (data.area or "").lower()

    results = []
    for cand in candidates:
        cand_tokens = set(tokenize(f"{cand.get('professionalTitle', '')} {cand.get('originalDescription', '')}"))
        text_sim = calculate_jaccard(input_tokens, cand_tokens)
        
        cand_area = (cand.get("area") or "").lower()
        area_match = bool(area_lower and cand_area and (area_lower in cand_area or cand_area in area_lower))

        geo_dist = None
        is_near = False
        if data.latitude and data.longitude and cand.get("latitude") and cand.get("longitude"):
            geo_dist = calculate_distance(data.latitude, data.longitude, cand.get("latitude"), cand.get("longitude"))
            if geo_dist is not None and geo_dist < 300:
                is_near = True

        score = (text_sim * 0.5) + (0.3 if area_match else 0.0) + (0.2 if is_near else 0.0)
        if score >= 0.25 or is_near:
            reason = f"Within {geo_dist}m of this location" if is_near else ("Same locality and matching issue keywords" if area_match else "Similar civic problem description")
            results.append({
                "complaint": cand,
                "similarityScore": round(score * 100),
                "geoDistanceMeters": geo_dist,
                "reason": reason
            })

    results.sort(key=lambda r: r["similarityScore"], reverse=True)
    return {"success": True, "count": len(results), "data": results[:5]}

# ==========================================
# 5. Complaint Core CRUD & Voting
# ==========================================
def enrich_complaint(c: Dict[str, Any], current_user: Optional[Dict[str, Any]] = None):
    doc = dict(c)
    doc["id"] = doc["_id"]
    # citizen
    citizen = next((u for u in db.users if str(u.get("_id")) == str(doc.get("citizenId"))), None)
    if citizen:
        doc["citizenId"] = {"_id": citizen["_id"], "name": citizen["name"], "email": citizen.get("email"), "phone": citizen.get("phone")}
    # department
    if doc.get("departmentId"):
        dept = next((d for d in db.departments if str(d.get("_id")) == str(doc.get("departmentId"))), None)
        if dept:
            doc["departmentId"] = dept
    # assigned authority
    if doc.get("assignedAuthorityId"):
        auth_u = next((u for u in db.users if str(u.get("_id")) == str(doc.get("assignedAuthorityId"))), None)
        if auth_u:
            doc["assignedAuthorityId"] = {"_id": auth_u["_id"], "name": auth_u["name"], "designation": auth_u.get("designation")}

    # hasVoted
    if current_user:
        voted = any(str(v.get("citizenId")) == str(current_user["_id"]) and str(v.get("complaintId")) == str(doc["_id"]) for v in db.votes)
        doc["hasVoted"] = voted
    else:
        doc["hasVoted"] = False
    return doc

@app.get("/api/complaints")
def get_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    area: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sortBy: Optional[str] = "createdAt",
    order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    request: Request = None
):
    current_user = get_current_user_optional(request)
    filtered = list(db.complaints)

    if category and category != "All":
        filtered = [c for c in filtered if c.get("category") == category]
    if status and status != "All":
        filtered = [c for c in filtered if c.get("status") == status]
    if priority and priority != "All":
        filtered = [c for c in filtered if c.get("priorityLevel") == priority]
    if area:
        area_l = area.lower()
        filtered = [c for c in filtered if area_l in (c.get("area") or "").lower()]
    if search:
        s_l = search.lower()
        filtered = [
            c for c in filtered if
            s_l in (c.get("complaintId") or "").lower() or
            s_l in (c.get("professionalTitle") or "").lower() or
            s_l in (c.get("professionalDescription") or "").lower() or
            s_l in (c.get("originalDescription") or "").lower() or
            s_l in (c.get("location") or "").lower() or
            s_l in (c.get("area") or "").lower()
        ]

    reverse_sort = (order == "desc")
    if sortBy == "votes":
        filtered.sort(key=lambda c: c.get("voteCount", 0), reverse=reverse_sort)
    elif sortBy == "priority":
        filtered.sort(key=lambda c: c.get("priorityScore", 0), reverse=reverse_sort)
    else:
        filtered.sort(key=lambda c: c.get("createdAt", ""), reverse=reverse_sort)

    total = len(filtered)
    skip = (page - 1) * limit
    paginated = filtered[skip : skip + limit]

    enriched = [enrich_complaint(c, current_user) for c in paginated]
    return {
        "success": True,
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / limit)),
        "data": enriched
    }

@app.get("/api/complaints/my")
def get_my_complaints(user: Dict[str, Any] = Depends(require_role("citizen"))):
    user_id_str = str(user["_id"])
    my_list = [c for c in db.complaints if str(c.get("citizenId")) == user_id_str]
    my_list.sort(key=lambda c: c.get("createdAt", ""), reverse=True)

    pending = len([c for c in my_list if c.get("status") in ["Submitted", "Under Review"]])
    in_progress = len([c for c in my_list if c.get("status") in ["Assigned", "In Progress"]])
    resolved = len([c for c in my_list if c.get("status") == "Resolved"])

    enriched = [enrich_complaint(c, user) for c in my_list]
    return {
        "success": True,
        "stats": {
            "totalSubmitted": len(my_list),
            "pending": pending,
            "inProgress": in_progress,
            "resolved": resolved
        },
        "data": enriched
    }

@app.get("/api/complaints/{id_or_code}")
def get_complaint_by_id(id_or_code: str, request: Request):
    current_user = get_current_user_optional(request)
    c = next((item for item in db.complaints if str(item.get("_id")) == id_or_code or item.get("complaintId", "").upper() == id_or_code.upper()), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    enriched = enrich_complaint(c, current_user)
    # history
    history = [h for h in db.complaint_histories if str(h.get("complaintId")) == str(c["_id"])]
    history.sort(key=lambda h: h.get("createdAt", ""))
    for h in history:
        auth_u = next((u for u in db.users if str(u.get("_id")) == str(h.get("changedBy"))), None)
        if auth_u:
            h["changedBy"] = {"_id": auth_u["_id"], "name": auth_u["name"], "role": auth_u.get("role"), "designation": auth_u.get("designation")}
    enriched["history"] = history
    return {"success": True, "data": enriched}

@app.post("/api/complaints")
async def create_complaint(
    request: Request,
    user: Dict[str, Any] = Depends(require_role("citizen"))
):
    form_data = await request.form()
    originalDescription = form_data.get("originalDescription", "").strip()
    professionalTitle = form_data.get("professionalTitle", "").strip()
    professionalDescription = form_data.get("professionalDescription", "").strip()
    category = form_data.get("category", "Other").strip()
    area = form_data.get("area", "").strip()
    location = form_data.get("location", "").strip()
    suggestedUrgency = form_data.get("suggestedUrgency", "Medium").strip()
    lat = float(form_data.get("latitude")) if form_data.get("latitude") else None
    lon = float(form_data.get("longitude")) if form_data.get("longitude") else None

    if not originalDescription or not professionalTitle or not professionalDescription or not area or not location:
        raise HTTPException(status_code=400, detail="Please fill in all required complaint fields")

    # Handle image uploads
    final_images = []
    for file in form_data.getlist("images"):
        if isinstance(file, UploadFile) and file.filename:
            file_ext = os.path.splitext(file.filename)[1]
            unique_fname = f"complaint-{new_id()}{file_ext}"
            fpath = os.path.join(UPLOADS_DIR, unique_fname)
            with open(fpath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            final_images.append(f"/uploads/{unique_fname}")

    # Priority calculation
    priority = calculate_priority(0, category, now_iso(), suggestedUrgency)

    # Unique Complaint ID
    import random, string
    complaintId = f"CC-2026-{''.join(random.choices(string.ascii_uppercase + string.digits, k=5))}"

    new_comp = {
        "_id": new_id(),
        "complaintId": complaintId,
        "citizenId": str(user["_id"]),
        "originalDescription": originalDescription,
        "professionalTitle": professionalTitle,
        "professionalDescription": professionalDescription,
        "category": category,
        "area": area,
        "location": location,
        "latitude": lat,
        "longitude": lon,
        "imageUrls": final_images,
        "status": "Submitted",
        "priorityScore": priority["priorityScore"],
        "priorityLevel": priority["priorityLevel"],
        "priorityReason": priority["priorityReason"],
        "voteCount": 0,
        "createdAt": now_iso(),
        "updatedAt": now_iso()
    }
    db.complaints.insert(0, new_comp)

    # Audit history
    db.complaint_histories.append({
        "_id": new_id(),
        "complaintId": new_comp["_id"],
        "changedBy": str(user["_id"]),
        "actionType": "CREATED",
        "newStatus": "Submitted",
        "remarks": "Complaint registered by citizen",
        "createdAt": now_iso()
    })

    create_notification(
        user["_id"],
        new_comp["_id"],
        "Complaint Registered",
        f'Your issue "{new_comp["professionalTitle"]}" was successfully logged with ID {new_comp["complaintId"]}.',
        "SUBMISSION"
    )
    db.save()

    return {"success": True, "message": "Complaint submitted successfully", "data": new_comp}

@app.post("/api/complaints/{id}/vote")
def vote_complaint(id: str, user: Dict[str, Any] = Depends(require_role("citizen"))):
    c = next((item for item in db.complaints if str(item.get("_id")) == id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if str(c.get("citizenId")) == str(user["_id"]):
        raise HTTPException(status_code=400, detail="You cannot vote for your own submitted complaint. Other community members can support it.")

    if c.get("status") in ["Resolved", "Rejected"]:
        raise HTTPException(status_code=400, detail=f"Voting is closed for complaints that are {c.get('status').lower()}.")

    existing_vote = next((v for v in db.votes if str(v.get("citizenId")) == str(user["_id"]) and str(v.get("complaintId")) == id), None)
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted to support this complaint.")

    db.votes.append({
        "_id": new_id(),
        "citizenId": str(user["_id"]),
        "complaintId": id,
        "createdAt": now_iso()
    })

    c["voteCount"] = c.get("voteCount", 0) + 1
    p = calculate_priority(c["voteCount"], c.get("category", "Other"), c.get("createdAt"), c.get("priorityLevel"))
    c["priorityScore"] = p["priorityScore"]
    c["priorityLevel"] = p["priorityLevel"]
    c["priorityReason"] = p["priorityReason"]
    c["updatedAt"] = now_iso()
    db.save()

    return {
        "success": True,
        "message": "Vote registered successfully",
        "voteCount": c["voteCount"],
        "priorityLevel": c["priorityLevel"],
        "priorityScore": c["priorityScore"]
    }

@app.delete("/api/complaints/{id}/vote")
def remove_vote(id: str, user: Dict[str, Any] = Depends(require_role("citizen"))):
    c = next((item for item in db.complaints if str(item.get("_id")) == id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    vote_idx = next((i for i, v in enumerate(db.votes) if str(v.get("citizenId")) == str(user["_id"]) and str(v.get("complaintId")) == id), None)
    if vote_idx is None:
        raise HTTPException(status_code=400, detail="You have not voted for this complaint yet")

    db.votes.pop(vote_idx)
    c["voteCount"] = max(0, c.get("voteCount", 1) - 1)
    p = calculate_priority(c["voteCount"], c.get("category", "Other"), c.get("createdAt"))
    c["priorityScore"] = p["priorityScore"]
    c["priorityLevel"] = p["priorityLevel"]
    c["priorityReason"] = p["priorityReason"]
    c["updatedAt"] = now_iso()
    db.save()

    return {
        "success": True,
        "message": "Vote removed successfully",
        "voteCount": c["voteCount"],
        "priorityLevel": c["priorityLevel"],
        "priorityScore": c["priorityScore"]
    }

# ==========================================
# 6. Authority Dashboard & Actions
# ==========================================
@app.get("/api/authority/dashboard")
def get_authority_dashboard(user: Dict[str, Any] = Depends(require_role("authority"))):
    total = len(db.complaints)
    new_sub = len([c for c in db.complaints if c.get("status") == "Submitted"])
    under_rev = len([c for c in db.complaints if c.get("status") == "Under Review"])
    assigned = len([c for c in db.complaints if c.get("status") == "Assigned"])
    in_prog = len([c for c in db.complaints if c.get("status") == "In Progress"])
    resolved = len([c for c in db.complaints if c.get("status") == "Resolved"])
    rejected = len([c for c in db.complaints if c.get("status") == "Rejected"])
    high_priority = len([c for c in db.complaints if c.get("priorityLevel") in ["High", "Critical"] and c.get("status") not in ["Resolved", "Rejected"]])

    # Recent history
    recent_hist = sorted(db.complaint_histories, key=lambda h: h.get("createdAt", ""), reverse=True)[:8]
    recent_activity = []
    for h in recent_hist:
        h_copy = dict(h)
        changed_by_user = next((u for u in db.users if str(u.get("_id")) == str(h.get("changedBy"))), None)
        if changed_by_user:
            h_copy["changedBy"] = {"name": changed_by_user["name"], "designation": changed_by_user.get("designation"), "role": changed_by_user.get("role")}
        comp = next((c for c in db.complaints if str(c.get("_id")) == str(h.get("complaintId"))), None)
        if comp:
            h_copy["complaintId"] = {"complaintId": comp.get("complaintId"), "professionalTitle": comp.get("professionalTitle")}
        recent_activity.append(h_copy)

    # Urgent complaints
    urgent_raw = [c for c in db.complaints if c.get("status") in ["Submitted", "Under Review", "Assigned", "In Progress"]]
    urgent_raw.sort(key=lambda c: (c.get("priorityScore", 0), c.get("voteCount", 0)), reverse=True)
    urgent_complaints = [enrich_complaint(c) for c in urgent_raw[:5]]

    return {
        "success": True,
        "stats": {
            "totalComplaints": total,
            "newSubmitted": new_sub,
            "pendingReview": under_rev,
            "assigned": assigned,
            "inProgress": in_prog,
            "resolved": resolved,
            "rejected": rejected,
            "highPriority": high_priority
        },
        "recentActivity": recent_activity,
        "urgentComplaints": urgent_complaints
    }

@app.get("/api/authority/complaints")
def get_authority_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    sortBy: Optional[str] = "createdAt",
    order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1),
    user: Dict[str, Any] = Depends(require_role("authority"))
):
    filtered = list(db.complaints)
    if status and status != "All":
        filtered = [c for c in filtered if c.get("status") == status]
    if category and category != "All":
        filtered = [c for c in filtered if c.get("category") == category]
    if priority and priority != "All":
        filtered = [c for c in filtered if c.get("priorityLevel") == priority]
    if department and department != "All":
        filtered = [c for c in filtered if str(c.get("departmentId")) == str(department)]
    if search:
        s_l = search.lower()
        filtered = [
            c for c in filtered if
            s_l in (c.get("complaintId") or "").lower() or
            s_l in (c.get("professionalTitle") or "").lower() or
            s_l in (c.get("originalDescription") or "").lower() or
            s_l in (c.get("location") or "").lower() or
            s_l in (c.get("area") or "").lower()
        ]

    reverse_sort = (order == "desc")
    if sortBy == "priority":
        filtered.sort(key=lambda c: c.get("priorityScore", 0), reverse=reverse_sort)
    elif sortBy == "votes":
        filtered.sort(key=lambda c: c.get("voteCount", 0), reverse=reverse_sort)
    else:
        filtered.sort(key=lambda c: c.get("createdAt", ""), reverse=reverse_sort)

    total = len(filtered)
    skip = (page - 1) * limit
    paginated = filtered[skip : skip + limit]

    enriched = [enrich_complaint(c) for c in paginated]
    return {
        "success": True,
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / limit)),
        "data": enriched
    }

class StatusUpdateRequest(BaseModel):
    status: str
    remarks: Optional[str] = None
    rejectionReason: Optional[str] = None
    resolutionNotes: Optional[str] = None
    resolutionEvidence: Optional[List[str]] = None

@app.patch("/api/authority/complaints/{id}/status")
def update_complaint_status(id: str, data: StatusUpdateRequest, user: Dict[str, Any] = Depends(require_role("authority"))):
    c = next((item for item in db.complaints if str(item.get("_id")) == id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    valid_statuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected']
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status specified")

    if data.status == 'Rejected' and (not data.rejectionReason or not data.rejectionReason.strip()):
        raise HTTPException(status_code=400, detail="A clear rejection reason is mandatory when marking a complaint as Rejected.")

    if data.status == 'Resolved' and (not data.resolutionNotes or not data.resolutionNotes.strip()):
        raise HTTPException(status_code=400, detail="Mandatory resolution notes are required when marking a complaint as Resolved.")

    prev_status = c.get("status")
    c["status"] = data.status
    if data.remarks: c["authorityRemarks"] = data.remarks.strip()
    if data.rejectionReason: c["rejectionReason"] = data.rejectionReason.strip()
    if data.resolutionNotes: c["resolutionNotes"] = data.resolutionNotes.strip()
    if data.resolutionEvidence: c["resolutionEvidence"] = data.resolutionEvidence
    if data.status == 'Resolved':
        c["resolvedAt"] = now_iso()
    c["updatedAt"] = now_iso()

    db.complaint_histories.append({
        "_id": new_id(),
        "complaintId": c["_id"],
        "changedBy": str(user["_id"]),
        "actionType": "RESOLVED" if data.status == 'Resolved' else ("REJECTED" if data.status == 'Rejected' else "STATUS_CHANGE"),
        "previousStatus": prev_status,
        "newStatus": data.status,
        "remarks": data.remarks or data.rejectionReason or data.resolutionNotes or f"Status updated to {data.status}",
        "createdAt": now_iso()
    })

    create_notification(
        c["citizenId"],
        c["_id"],
        f"Complaint Status: {data.status}",
        f'Your issue "{c.get("professionalTitle")}" status has been updated to {data.status}.',
        "STATUS_UPDATE"
    )
    db.save()

    return {"success": True, "message": f"Complaint status updated to {data.status}", "data": enrich_complaint(c)}

class AssignRequest(BaseModel):
    departmentId: str
    assignedAuthorityId: Optional[str] = None
    remarks: Optional[str] = None

@app.patch("/api/authority/complaints/{id}/assign")
def assign_complaint(id: str, data: AssignRequest, user: Dict[str, Any] = Depends(require_role("authority"))):
    c = next((item for item in db.complaints if str(item.get("_id")) == id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    dept = next((d for d in db.departments if str(d.get("_id")) == str(data.departmentId)), None)
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")

    prev_status = c.get("status")
    c["departmentId"] = str(data.departmentId)
    if data.assignedAuthorityId:
        c["assignedAuthorityId"] = str(data.assignedAuthorityId)
    if c.get("status") in ["Submitted", "Under Review"]:
        c["status"] = "Assigned"
    if data.remarks:
        c["authorityRemarks"] = data.remarks
    c["updatedAt"] = now_iso()

    db.complaint_histories.append({
        "_id": new_id(),
        "complaintId": c["_id"],
        "changedBy": str(user["_id"]),
        "actionType": "ASSIGNED",
        "previousStatus": prev_status,
        "newStatus": c["status"],
        "remarks": data.remarks or f"Assigned to department: {dept.get('name')}",
        "createdAt": now_iso()
    })

    create_notification(
        c["citizenId"],
        c["_id"],
        "Department Assigned",
        f'Your complaint "{c.get("professionalTitle")}" has been assigned to the {dept.get("name")} department.',
        "ASSIGNMENT"
    )
    db.save()

    return {"success": True, "message": f"Complaint assigned to {dept.get('name')}", "data": enrich_complaint(c)}

class PriorityOverrideRequest(BaseModel):
    priorityLevel: str
    priorityReason: str

@app.patch("/api/authority/complaints/{id}/priority")
def override_priority(id: str, data: PriorityOverrideRequest, user: Dict[str, Any] = Depends(require_role("authority"))):
    if data.priorityLevel not in ['Low', 'Medium', 'High', 'Critical']:
        raise HTTPException(status_code=400, detail="Invalid priority level")
    if not data.priorityReason or not data.priorityReason.strip():
        raise HTTPException(status_code=400, detail="A formal reason is required for administrative priority override.")

    c = next((item for item in db.complaints if str(item.get("_id")) == id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    prev = c.get("priorityLevel")
    c["priorityLevel"] = data.priorityLevel
    c["priorityReason"] = f"Authority Override: {data.priorityReason.strip()}"
    scores = {"Low": 25, "Medium": 50, "High": 75, "Critical": 95}
    c["priorityScore"] = scores[data.priorityLevel]
    c["updatedAt"] = now_iso()

    db.complaint_histories.append({
        "_id": new_id(),
        "complaintId": c["_id"],
        "changedBy": str(user["_id"]),
        "actionType": "PRIORITY_OVERRIDE",
        "previousStatus": c.get("status"),
        "newStatus": c.get("status"),
        "remarks": f"Priority changed from {prev} to {data.priorityLevel}. Justification: {data.priorityReason}",
        "createdAt": now_iso()
    })
    db.save()

    return {"success": True, "message": f"Priority overridden to {data.priorityLevel}", "data": enrich_complaint(c)}

@app.get("/api/authority/analytics")
def get_authority_analytics(user: Dict[str, Any] = Depends(require_role("authority"))):
    # byCategory
    cats: Dict[str, Dict[str, Any]] = {}
    for c in db.complaints:
        cat = c.get("category", "Other")
        if cat not in cats:
            cats[cat] = {"_id": cat, "count": 0, "totalVotes": 0}
        cats[cat]["count"] += 1
        cats[cat]["totalVotes"] += c.get("voteCount", 0)
    byCategory = sorted(cats.values(), key=lambda x: x["count"], reverse=True)

    # byStatus
    statuses: Dict[str, int] = {}
    for c in db.complaints:
        st = c.get("status", "Submitted")
        statuses[st] = statuses.get(st, 0) + 1
    byStatus = [{"_id": k, "count": v} for k, v in statuses.items()]

    # byPriority
    priorities: Dict[str, int] = {}
    for c in db.complaints:
        pr = c.get("priorityLevel", "Medium")
        priorities[pr] = priorities.get(pr, 0) + 1
    byPriority = [{"_id": k, "count": v} for k, v in priorities.items()]

    # monthlyTrends
    trends: Dict[str, Dict[str, Any]] = {}
    for c in db.complaints:
        created = c.get("createdAt", "")
        if len(created) >= 7:
            key = created[:7]  # YYYY-MM
            if key not in trends:
                trends[key] = {"_id": {"year": int(key[:4]), "month": int(key[5:7])}, "submitted": 0, "resolved": 0}
            trends[key]["submitted"] += 1
            if c.get("status") == "Resolved":
                trends[key]["resolved"] += 1
    monthlyTrends = sorted(trends.values(), key=lambda t: (t["_id"]["year"], t["_id"]["month"]))

    return {
        "success": True,
        "data": {
            "byCategory": byCategory,
            "byStatus": byStatus,
            "byPriority": byPriority,
            "monthlyTrends": monthlyTrends
        }
    }

# ==========================================
# 7. Notifications
# ==========================================
@app.get("/api/notifications")
def get_notifications(user: Dict[str, Any] = Depends(get_current_user)):
    user_id_str = str(user["_id"])
    user_notifs = [n for n in db.notifications if str(n.get("recipientId")) == user_id_str]
    user_notifs.sort(key=lambda n: n.get("createdAt", ""), reverse=True)
    unread = len([n for n in user_notifs if not n.get("read", False)])

    enriched = []
    for n in user_notifs[:30]:
        n_copy = dict(n)
        comp = next((c for c in db.complaints if str(c.get("_id")) == str(n.get("complaintId"))), None)
        if comp:
            n_copy["complaintId"] = {"complaintId": comp.get("complaintId"), "professionalTitle": comp.get("professionalTitle"), "status": comp.get("status")}
        enriched.append(n_copy)

    return {"success": True, "unreadCount": unread, "data": enriched}

@app.patch("/api/notifications/read-all")
def mark_all_read(user: Dict[str, Any] = Depends(get_current_user)):
    user_id_str = str(user["_id"])
    for n in db.notifications:
        if str(n.get("recipientId")) == user_id_str:
            n["read"] = True
    db.save()
    return {"success": True, "message": "All notifications marked as read"}

@app.patch("/api/notifications/{id}/read")
def mark_single_read(id: str, user: Dict[str, Any] = Depends(get_current_user)):
    user_id_str = str(user["_id"])
    notif = next((n for n in db.notifications if str(n.get("_id")) == id and str(n.get("recipientId")) == user_id_str), None)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif["read"] = True
    db.save()
    return {"success": True, "message": "Notification marked as read", "data": notif}
