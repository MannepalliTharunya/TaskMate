# TaskAI — AI-Powered Task & Knowledge Management System

A full-stack web application combining task management with AI-powered semantic document search. Admins manage tasks and upload knowledge documents; users complete tasks and search the knowledge base using natural language.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Django 4.2, Django REST Framework |
| Authentication | SimpleJWT (JWT access + refresh tokens) |
| Database | MySQL 8.0 (via PyMySQL) |
| AI / Search | sentence-transformers (`all-MiniLM-L6-v2`), FAISS (IndexFlatL2) |
| Frontend | React 18, React Router DOM v6, Axios |
| Styling | Pure CSS with CSS custom properties |

---

## Architecture Overview

```
TaskMind/
├── backend/                  Django REST API
│   ├── api/
│   │   ├── models/           User, Role, Task, Document, ActivityLog
│   │   ├── serializers/      DRF serializers with validation
│   │   ├── views/            APIView classes (auth, tasks, docs, search, analytics)
│   │   ├── services/         FAISSService (embeddings + vector search), activity logger
│   │   ├── permissions/      IsAdmin, IsAdminOrReadOwn
│   │   ├── urls/             One URL file per domain
│   │   └── utils/            Pagination
│   └── config/               Django settings, URL root, WSGI
├── frontend/                 React SPA
│   └── src/
│       ├── components/       Sidebar, Navbar, AppLayout, StatusBadge, Pagination
│       ├── context/          AuthContext (JWT state management)
│       ├── pages/            Login, Register, Dashboard, Tasks, Documents, Search, Analytics
│       ├── routes/           ProtectedRoute (auth + role guard)
│       ├── services/         Axios API layer (one file per domain)
│       └── styles/           globals.css (design tokens + all component styles)
└── database/                 schema.sql, sample_data.sql, queries.sql
```

---

## How the AI Semantic Search Works

1. **Admin uploads** a `.txt` document via the Documents page.
2. The backend **chunks** the text into 500-word overlapping segments.
3. Each chunk is converted to a **384-dimensional embedding vector** using `all-MiniLM-L6-v2`.
4. Vectors are stored in a **FAISS IndexFlatL2** index persisted to `faiss_index/` on disk.
5. When a user **searches**, the query is embedded with the same model.
6. FAISS finds the **nearest vectors** (L2 distance) and returns the most semantically similar chunks.
7. Results are enriched with document metadata and returned with a **0–1 similarity score**.

No OpenAI or external API is used — the model runs entirely locally.

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0

### 1. Clone the repository

```bash
git clone <repo-url>
cd TaskMind
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

The `.env` file is included in the repo with working local credentials — no changes needed to get started.

### 3. MySQL setup

In MySQL Workbench or CLI, run:

```sql
CREATE USER 'taskai'@'localhost' IDENTIFIED BY 'TaskAI@123';
CREATE USER 'taskai'@'127.0.0.1' IDENTIFIED BY 'TaskAI@123';
CREATE DATABASE IF NOT EXISTS task_knowledge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON task_knowledge_db.* TO 'taskai'@'localhost';
GRANT ALL PRIVILEGES ON task_knowledge_db.* TO 'taskai'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### 4. Run migrations and seed data

```bash
python manage.py migrate
python manage.py seed_roles
```

### 5. Create your first admin user

```bash
# Via API (backend must be running):
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","username":"admin","password":"Admin@123","role":"admin"}'
```

Or use the Register page in the frontend.

### 6. Start the backend

```bash
python manage.py runserver
# API available at http://127.0.0.1:8000/api/
```

### 7. Frontend setup

```bash
cd ../frontend
npm install
npm start
# App available at http://localhost:3000
```

The frontend proxies `/api` requests to `http://localhost:8000` automatically.

---

## Quick Start — Copy-Paste Ready

Everything you need to run this project locally is below. No guessing.

### backend/.env (already included in repo)

```env
SECRET_KEY=django-insecure-taskai-dev-secret-key-change-in-production-xyz123
DEBUG=True

DB_NAME=task_knowledge_db
DB_USER=taskai
DB_PASSWORD=TaskAI@123
DB_HOST=127.0.0.1
DB_PORT=3306

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

MEDIA_ROOT=media/
FAISS_INDEX_PATH=faiss_index/
```

### MySQL — run once in Workbench or CLI

```sql
CREATE USER IF NOT EXISTS 'taskai'@'localhost' IDENTIFIED BY 'TaskAI@123';
CREATE USER IF NOT EXISTS 'taskai'@'127.0.0.1' IDENTIFIED BY 'TaskAI@123';
CREATE DATABASE IF NOT EXISTS task_knowledge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON task_knowledge_db.* TO 'taskai'@'localhost';
GRANT ALL PRIVILEGES ON task_knowledge_db.* TO 'taskai'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### Login credentials (after setup)

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskai.com | Admin@123 |
| User | john@taskai.com | User@123 |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | Public | Register new user |
| POST | `/api/auth/login/` | Public | Login, get JWT tokens |
| POST | `/api/auth/refresh/` | Public | Refresh access token |
| GET | `/api/auth/me/` | Any | Current user profile |
| GET | `/api/tasks/` | Any | List tasks (filtered by role) |
| POST | `/api/tasks/` | Admin | Create task |
| GET | `/api/tasks/<id>/` | Any | Task detail |
| PATCH | `/api/tasks/<id>/` | Any | Update task |
| DELETE | `/api/tasks/<id>/` | Admin | Delete task |
| GET | `/api/documents/` | Any | List documents |
| POST | `/api/documents/` | Admin | Upload + index document |
| DELETE | `/api/documents/<id>/` | Admin | Delete document |
| GET | `/api/search/?q=<query>` | Any | Semantic search |
| GET | `/api/analytics/` | Admin | System analytics |

### Task filtering

```
GET /api/tasks/?status=pending
GET /api/tasks/?status=completed
GET /api/tasks/?assigned_to=2        (admin only)
```

---

## Role-Based Access Control

| Feature | Admin | User |
|---|---|---|
| View all tasks | ✅ | ❌ (own only) |
| Create / delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| Upload documents | ✅ | ❌ |
| View documents | ✅ | ✅ |
| AI semantic search | ✅ | ✅ |
| Analytics dashboard | ✅ | ❌ |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | — | Django secret key |
| `DEBUG` | No | `False` | Enable debug mode |
| `DB_NAME` | No | `task_knowledge_db` | MySQL database name |
| `DB_USER` | No | `root` | MySQL username |
| `DB_PASSWORD` | ✅ | — | MySQL password |
| `DB_HOST` | No | `127.0.0.1` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | No | `60` | Access token TTL |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | No | `7` | Refresh token TTL |
| `ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated origins |
| `FAISS_INDEX_PATH` | No | `faiss_index/` | FAISS index directory |
