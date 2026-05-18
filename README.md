# TaskFlow 🚀

Full-stack task management app — React + Node.js + PostgreSQL, fully containerised.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

---

## ⚡ Quick Start (3 commands)

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
make up
```

Then open **http://localhost:3000**

Login with the seeded demo account:
- Email: `dev@taskflow.io`
- Password: `password123`

---

## Folder Structure

```
taskflow/
├── frontend/          # React + Tailwind + Vite
├── backend/           # Node.js + Express + PostgreSQL
├── docker-compose.yml # Production-like local stack
├── docker-compose.dev.yml  # Dev overrides (hot reload)
├── Makefile           # Shortcut commands
└── README.md
```

---

## Commands

| Command | What it does |
|---|---|
| `make up` | Build + start all containers (detached) |
| `make down` | Stop all containers |
| `make dev` | Start with hot reload (nodemon + Vite HMR) |
| `make logs` | Tail all logs |
| `make logs-api` | Tail backend logs only |
| `make test` | Run backend test suite |
| `make db-shell` | Open psql shell |
| `make clean` | Stop + remove local images |
| `make nuke` | ⚠️ Remove everything including DB data |

---

## Services

| Service | URL | Description |
|---|---|---|
| Frontend | http://localhost:3000 | React app (Nginx) |
| Backend API | http://localhost:4000 | Express REST API |
| PostgreSQL | localhost:5432 | Database |
| Health check | http://localhost:4000/health | API status |

---

## Environment Variables

Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in values.

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=4000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_this_to_something_long_and_random
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/tasks?project_id=
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/reorder
DELETE /api/tasks/:id

GET    /health
```

---

## Step-by-step Progress

- [x] Step 1 — React UI (Board, TaskCard, Column, Modal, Auth pages)
- [x] Step 2 — Node.js + Express backend + PostgreSQL schema
- [x] Step 3 — Docker + Docker Compose
- [ ] Step 4 — GitHub Actions CI/CD pipeline
- [ ] Step 5 — AWS EC2 + RDS + S3/CloudFront deployment

## Deployed to AWS EC2
