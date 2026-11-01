# CivicConnect (Django + PostgreSQL)

Crowd-based civic issue reporting: AI-assisted complaint writing (Gemini or offline fallback), duplicate detection,
community voting, transparent priority scoring, Leaflet maps, and an authority portal with analytics.

## Run it

1. Install Python 3.10+ and PostgreSQL. Create the database:
   ```
   psql -U postgres -c "CREATE DATABASE civicconnect;"
   ```
2. Set up the project:
   ```
   python -m venv venv
   venv\Scripts\activate          # Windows   (Linux/Mac: source venv/bin/activate)
   pip install -r requirements.txt
   cp .env.example .env           # Windows: copy .env.example .env
   ```
   Edit `.env` and set `DB_PASSWORD` (and the other DB values if yours differ).
3. Create tables and demo data:
   ```
   python manage.py migrate
   python manage.py seed
   python manage.py runserver
   ```
4. Open http://127.0.0.1:8000

## Logins
| Role | URL | Email | Password |
|---|---|---|---|
| Authority | /authority/login/ | admin@civicconnect.gov.in | Admin@Civic2026! |
| Citizen | /login/ | aarav.sharma@example.com | Citizen@123 |

Only the authority account created by `create_authority` (or `seed`) can use the authority portal. Public registration always creates citizens.

## Rules built in
- One vote per citizen per complaint (database unique constraint); no voting on your own complaint.
- Resolving needs a resolution note; rejecting needs a reason; overriding priority needs a reason.
- Priority score (0-100) = category hazard + log(votes) + age + safety keywords; the breakdown is shown on each complaint.
- Duplicates: Jaccard text similarity, or within 200 m (Haversine) in the same category.
- Gemini is used when `GEMINI_API_KEY` is set; otherwise the offline engine runs. The page says which one wrote the text.

## Quick test without PostgreSQL
Set `USE_SQLITE=1` in your environment to use a local SQLite file instead.

## Structure
`config/` settings and URLs · `accounts/` custom email-login user, roles · `complaints/` models, views, services (`ai`, `priority`, `duplicates`), seed command · `templates/`
