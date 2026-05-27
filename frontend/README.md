# TaskAI Frontend

React frontend for the AI-Powered Task & Knowledge Management System.

## Tech Stack

- React 18 + React Router DOM v6
- Axios with JWT interceptors
- Pure CSS (no framework dependency)

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # set REACT_APP_API_URL if not using proxy
npm start
```

The dev server proxies `/api` to `http://localhost:8000` via `package.json` proxy config.

## Pages & Access

| Page | Path | Admin | User |
|---|---|---|---|
| Login | /login | ✓ | ✓ |
| Dashboard | /dashboard | ✓ | ✓ |
| Tasks | /tasks | ✓ (all) | ✓ (own) |
| Create Task | /tasks/create | ✓ | ✗ |
| Documents | /documents | ✓ (upload+view) | ✓ (view) |
| AI Search | /search | ✓ | ✓ |
| Analytics | /analytics | ✓ | ✗ |

## Project Structure

```
src/
├── components/     — Sidebar, Navbar, AppLayout, StatusBadge, Pagination
├── context/        — AuthContext (JWT state, login/logout)
├── pages/          — One file per page
├── routes/         — ProtectedRoute (auth + role guard)
├── services/       — Axios API layer (auth, tasks, documents, search, analytics)
└── styles/         — globals.css (design tokens + all component styles)
```
