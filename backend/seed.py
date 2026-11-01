import sys
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from db import db, new_id, now_iso
from services_algo import calculate_priority
import bcrypt

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def seed_data():
    print("[Seed] Starting FastAPI backend seeding...")
    db.users.clear()
    db.departments.clear()
    db.complaints.clear()
    db.votes.clear()
    db.complaint_histories.clear()
    db.notifications.clear()

    # 1. Departments
    departments = [
        {
            "_id": new_id(),
            "name": 'Roads & Public Infrastructure',
            "code": 'R&PI',
            "description": 'Pothole restoration, street re-carpeting, pavements, flyovers and pedestrian safety',
            "contactEmail": 'roads@civicconnect.gov.in',
            "contactPhone": '+91-11-23001001',
            "headOfficial": 'Er. Rajesh Kumar Sharma',
            "createdAt": now_iso()
        },
        {
            "_id": new_id(),
            "name": 'Sanitation & Solid Waste Management',
            "code": 'SSWM',
            "description": 'Municipal garbage disposal, door-to-door collection, street sweeping, community dump clearance',
            "contactEmail": 'sanitation@civicconnect.gov.in',
            "contactPhone": '+91-11-23001002',
            "headOfficial": 'Dr. Sunita Deshmukh',
            "createdAt": now_iso()
        },
        {
            "_id": new_id(),
            "name": 'Water Supply & Sewerage Board',
            "code": 'WSSB',
            "description": 'Potable water pipelines, distribution leakage, sewage lines, storm drain maintenance',
            "contactEmail": 'water@civicconnect.gov.in',
            "contactPhone": '+91-11-23001003',
            "headOfficial": 'Er. Arvind Mehta',
            "createdAt": now_iso()
        },
        {
            "_id": new_id(),
            "name": 'Electricity & Streetlighting Authority',
            "code": 'ESA',
            "description": 'Public illumination, solar street lights, pole repairs, exposed electrical hazard mitigation',
            "contactEmail": 'lights@civicconnect.gov.in',
            "contactPhone": '+91-11-23001004',
            "headOfficial": 'Er. Priya Swaminathan',
            "createdAt": now_iso()
        },
        {
            "_id": new_id(),
            "name": 'Horticulture & Public Parks',
            "code": 'HPP',
            "description": 'Civic garden maintenance, broken benches, playground safety, tree pruning',
            "contactEmail": 'parks@civicconnect.gov.in',
            "contactPhone": '+91-11-23001005',
            "headOfficial": 'Shri Vikram Patil',
            "createdAt": now_iso()
        }
    ]
    db.departments.extend(departments)

    # 2. Authority & Demo Citizens
    auth_pass = hash_password('Admin@Civic2026!')
    cit_pass = hash_password('Citizen@123')

    authority = {
        "_id": new_id(),
        "name": 'Municipal Commissioner A. K. Verma',
        "email": 'admin@civicconnect.gov.in',
        "phone": '+91-9876543210',
        "passwordHash": auth_pass,
        "role": 'authority',
        "department": departments[0]["_id"],
        "designation": 'Chief Municipal Officer',
        "createdAt": now_iso()
    }
    db.users.append(authority)

    citizens = [
        {"_id": new_id(), "name": 'Aarav Sharma', "email": 'aarav.sharma@example.com', "phone": '+91-9811122233', "passwordHash": cit_pass, "role": 'citizen', "createdAt": now_iso()},
        {"_id": new_id(), "name": 'Sneha Patel', "email": 'sneha.patel@example.com', "phone": '+91-9822233344', "passwordHash": cit_pass, "role": 'citizen', "createdAt": now_iso()},
        {"_id": new_id(), "name": 'Rohan Iyer', "email": 'rohan.iyer@example.com', "phone": '+91-9833344455', "passwordHash": cit_pass, "role": 'citizen', "createdAt": now_iso()},
        {"_id": new_id(), "name": 'Ananya Gupta', "email": 'ananya.gupta@example.com', "phone": '+91-9844455566', "passwordHash": cit_pass, "role": 'citizen', "createdAt": now_iso()},
    ]
    db.users.extend(citizens)

    # 3. Demo Complaints
    complaints = [
        {
            "_id": new_id(),
            "complaintId": 'CC-2026-RD01',
            "citizenId": citizens[0]["_id"],
            "originalDescription": 'The main road connecting Sector 14 to metro station has 4 very deep potholes. Two scooter riders fell yesterday.',
            "professionalTitle": 'Request for Urgent Road Surface Repair & Pothole Rectification on Metro Approach Road',
            "professionalDescription": 'To the Concerned Executive Engineer, Roads & Public Infrastructure:\n\nI am writing to formally submit a community civic grievance regarding dangerous road craters along the Sector 14 Metro Station approach corridor. Deep potholes pose imminent hazard to two-wheeler commuters.\n\nImmediate mechanized road resurfacing and cold-mix patch filling are urgently petitioned.',
            "category": 'Roads & Potholes',
            "area": 'Sector 14, Metro Corridor',
            "location": 'Opposite Gate 3, Sector 14 Metro Station',
            "latitude": 28.6139,
            "longitude": 77.2090,
            "imageUrls": ['/uploads/demo-pothole.jpg'],
            "status": 'In Progress',
            "priorityScore": 82,
            "priorityLevel": 'Critical',
            "priorityReason": 'Priority Score 82/100: Category weight (25pts), 42 community votes (38pts), pending duration 4d (10pts), urgency factor (10pts).',
            "voteCount": 42,
            "departmentId": departments[0]["_id"],
            "assignedAuthorityId": authority["_id"],
            "authorityRemarks": 'Inspected on 11th Oct. Tender issued for asphalt road-patching.',
            "createdAt": now_iso(),
            "updatedAt": now_iso()
        },
        {
            "_id": new_id(),
            "complaintId": 'CC-2026-GB02',
            "citizenId": citizens[1]["_id"],
            "originalDescription": 'Huge pile of garbage accumulated outside public park entrance since last Friday. Stray dogs scattering waste everywhere.',
            "professionalTitle": 'Civic Grievance: Immediate Removal of Accumulated Solid Waste Outside Children Park',
            "professionalDescription": 'To the Health & Sanitation Officer:\n\nThis petition highlights hazardous accumulation of uncollected municipal solid waste adjacent to the southern gate of Green Valley Children Park. Immediate dumper collection is required.',
            "category": 'Garbage & Sanitation',
            "area": 'Green Valley, Phase 2',
            "location": 'Gate No. 2, Green Valley Public Park',
            "latitude": 28.6250,
            "longitude": 77.2180,
            "imageUrls": ['/uploads/demo-garbage.jpg'],
            "status": 'Assigned',
            "priorityScore": 78,
            "priorityLevel": 'High',
            "priorityReason": 'Priority Score 78/100: Category weight (20pts), 35 community votes (36pts), urgency factor (14pts).',
            "voteCount": 35,
            "departmentId": departments[1]["_id"],
            "assignedAuthorityId": authority["_id"],
            "authorityRemarks": 'Assigned to Ward Sanitation Inspector for dump-truck clearance drive.',
            "createdAt": now_iso(),
            "updatedAt": now_iso()
        },
        {
            "_id": new_id(),
            "complaintId": 'CC-2026-LT03',
            "citizenId": citizens[2]["_id"],
            "originalDescription": 'Three streetlights along our residential lane have stopped working. Entire block is pitch dark.',
            "professionalTitle": 'Notice of Inoperative Street Lighting Creating Public Safety Vulnerability',
            "professionalDescription": 'To the Electrical Engineering Department:\n\nWe formally submit a request regarding consecutive non-functional streetlights along 5th Cross Lane. Night darkness presents public safety risk.',
            "category": 'Streetlights & Electrical',
            "area": 'Model Town, 5th Cross',
            "location": 'Poles #14 to #17, 5th Cross Lane',
            "latitude": 28.6320,
            "longitude": 77.2250,
            "imageUrls": ['/uploads/demo-light.jpg'],
            "status": 'Under Review',
            "priorityScore": 65,
            "priorityLevel": 'High',
            "priorityReason": 'Priority Score 65/100: Category weight (30pts), 18 community votes (25pts), urgency factor (5pts).',
            "voteCount": 18,
            "departmentId": departments[3]["_id"],
            "createdAt": now_iso(),
            "updatedAt": now_iso()
        },
        {
            "_id": new_id(),
            "complaintId": 'CC-2026-WT04',
            "citizenId": citizens[3]["_id"],
            "originalDescription": 'Drinking water pipeline joint broke under footpath. Thousands of liters of water wasted.',
            "professionalTitle": 'Urgent Redressal: Main Potable Water Supply Pipeline Fracture & Severe Wastage',
            "professionalDescription": 'To the Water Supply & Sewerage Board:\n\nMajor rupture in underground potable water mainline. Outflow is flooding the street and wasting treated municipal water.',
            "category": 'Water Supply & Leakage',
            "area": 'Mahatma Gandhi Road, Market Area',
            "location": 'In front of Post Office Footpath, MG Road',
            "latitude": 28.6400,
            "longitude": 77.2300,
            "imageUrls": ['/uploads/demo-water.jpg'],
            "status": 'Submitted',
            "priorityScore": 88,
            "priorityLevel": 'Critical',
            "priorityReason": 'Priority Score 88/100: Category weight (22pts), 52 community votes (41pts), urgency factor (25pts).',
            "voteCount": 52,
            "departmentId": departments[2]["_id"],
            "createdAt": now_iso(),
            "updatedAt": now_iso()
        },
        {
            "_id": new_id(),
            "complaintId": 'CC-2026-DR05',
            "citizenId": citizens[0]["_id"],
            "originalDescription": 'Stormwater drain overflowing behind community hall.',
            "professionalTitle": 'Formal Redressal for Desilting & Overflow Prevention in Stormwater Drain',
            "professionalDescription": 'To the Municipal Drainage Division:\n\nSilt buildup in primary canal behind community hall. Suction and desilting requested.',
            "category": 'Drainage & Sewage',
            "area": 'Block B, Vasant Vihar',
            "location": 'Rear perimeter of Community Hall, Block B',
            "latitude": 28.5600,
            "longitude": 77.1600,
            "imageUrls": ['/uploads/demo-drain.jpg'],
            "status": 'Resolved',
            "priorityScore": 72,
            "priorityLevel": 'High',
            "priorityReason": 'Resolved issue archive score',
            "voteCount": 29,
            "departmentId": departments[2]["_id"],
            "assignedAuthorityId": authority["_id"],
            "authorityRemarks": 'Super Sucker machine deployed. Drain completely desilted.',
            "resolutionNotes": 'Suction and desilting operations completed successfully by Drainage Sub-division 2.',
            "resolvedAt": now_iso(),
            "createdAt": now_iso(),
            "updatedAt": now_iso()
        }
    ]
    db.complaints.extend(complaints)

    # 4. Initial Hist & Notifications
    for c in complaints:
        db.complaint_histories.append({
            "_id": new_id(),
            "complaintId": c["_id"],
            "changedBy": c["citizenId"],
            "actionType": "CREATED",
            "newStatus": "Submitted",
            "remarks": "Initial complaint registered",
            "createdAt": c["createdAt"]
        })

    db.save()
    print("[Seed] Database successfully seeded with departments, authority, citizens and complaints!")

if __name__ == "__main__":
    seed_data()
