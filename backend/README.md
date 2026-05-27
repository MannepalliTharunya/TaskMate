# AI-Powered Task & Knowledge Management System

Django + DRF backend with JWT auth, MySQL, FAISS semantic search, and RBAC.

## Tech Stack

- Django 4.2 + Django REST Framework
- MySQL
- SimpleJWT for authentication
- FAISS + sentence-transformers (all-MiniLM-L6-v2) for semantic search
- Role-based access control (Admin / User)

---

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- MySQL 8.0+
- pip

### 2. Clone & install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your DB credentials and secret key
```

### 4. Create MySQL database

```sql
CREATE DATABASE task_knowledge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Seed roles

```bash
python manage.py seed_roles
```

### 7. Create superuser (optional)

```bash
python manage.py createsuperuser
```

### 8. Run the server

```bash
python manage.py runserver
```

---

## API Documentation

Base URL: `http://localhost:8000/api/`

All protected endpoints require: `Authorization: Bearer <access_token>`

---

### Authentication

#### POST /api/auth/register/
Register a new user.

Request:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepass123",
  "role": "user"
}
```

Response `201`:
```json
{
  "user": { "id": 1, "email": "...", "role": { "name": "user" } },
  "access": "<jwt_token>",
  "refresh": "<refresh_token>"
}
```

---

#### POST /api/auth/login/
Login and receive JWT tokens.

Request:
```json
{ "email": "user@example.com", "password": "securepass123" }
```

Response `200`:
```json
{
  "user": { ... },
  "access": "<jwt_token>",
  "refresh": "<refresh_token>"
}
```

---

#### POST /api/auth/refresh/
Refresh access token.

Request:
```json
{ "refresh": "<refresh_token>" }
```

---

#### GET /api/auth/me/
Get current user profile. Requires auth.

---

### Tasks

#### GET /api/tasks/
List tasks. Admins see all; users see only assigned tasks.

Query params:
- `status=pending|completed`
- `assigned_to=<user_id>` (admin only)
- `page=1`, `page_size=20`

#### POST /api/tasks/
Create a task. Admin only.

Request:
```json
{
  "title": "Fix bug #42",
  "description": "...",
  "assigned_to": 3,
  "due_date": "2025-12-31"
}
```

#### GET /api/tasks/<id>/
Get task detail.

#### PATCH /api/tasks/<id>/
Update task. Admins can update any field; users can only update `status`.

User request:
```json
{ "status": "completed" }
```

#### DELETE /api/tasks/<id>/
Delete task. Admin only.

---

### Documents

#### GET /api/documents/
List all documents. Requires auth.

#### POST /api/documents/
Upload a `.txt` document. Admin only. Use `multipart/form-data`.

Fields:
- `title` (string)
- `file` (.txt file)

#### GET /api/documents/<id>/
Get document detail.

#### DELETE /api/documents/<id>/
Delete document and remove from FAISS index. Admin only.

---

### Search

#### GET /api/search/?q=<query>
Semantic search across indexed documents.

Query params:
- `q` (required) — search query
- `top_k` (optional, default 5, max 20) — number of results

Response:
```json
{
  "query": "machine learning basics",
  "results": [
    {
      "doc_id": 1,
      "doc_title": "ML Guide",
      "chunk_index": 0,
      "text": "...",
      "score": 0.87
    }
  ]
}
```

---

### Analytics

#### GET /api/analytics/
Admin only. Returns system-wide stats.

Response:
```json
{
  "tasks": { "total": 50, "pending": 30, "completed": 20 },
  "documents": { "total": 12 },
  "searches": { "total": 145 },
  "users": { "total": 8 }
}
```

---

## RBAC Summary

| Endpoint | Admin | User |
|---|---|---|
| Register/Login | ✓ | ✓ |
| Create task | ✓ | ✗ |
| View tasks | All | Own only |
| Update task status | ✓ | ✓ (own) |
| Upload document | ✓ | ✗ |
| View documents | ✓ | ✓ |
| Search | ✓ | ✓ |
| Analytics | ✓ | ✗ |

---

## FAISS Semantic Search

Documents are chunked (500 words, 50-word overlap) and embedded using `all-MiniLM-L6-v2` (384-dim vectors). The FAISS `IndexFlatL2` index is persisted to `faiss_index/` on disk. Scores are normalized from L2 distance to a 0–1 similarity score.
