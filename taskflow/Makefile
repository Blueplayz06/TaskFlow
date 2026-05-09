# TaskFlow — Makefile shortcuts
# Usage: make <command>

.PHONY: up down dev build logs ps clean nuke test

# ── Production-like local stack ─────────────────────────────
up:
	docker compose up --build -d
	@echo "\n✅  TaskFlow running:"
	@echo "   Frontend → http://localhost:3000"
	@echo "   Backend  → http://localhost:4000"
	@echo "   DB       → localhost:5432\n"

down:
	docker compose down

# ── Dev stack (hot reload) ───────────────────────────────────
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# ── Build images only (no start) ────────────────────────────
build:
	docker compose build --no-cache

# ── Logs ────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f backend

logs-db:
	docker compose logs -f postgres

# ── Status ──────────────────────────────────────────────────
ps:
	docker compose ps

# ── Run backend tests inside container ──────────────────────
test:
	docker compose exec backend npm test

# ── Database shortcuts ───────────────────────────────────────
db-shell:
	docker compose exec postgres psql -U postgres -d taskflow

db-migrate:
	docker compose exec backend npm run migrate

# ── Clean up ────────────────────────────────────────────────
clean:
	docker compose down --rmi local

# !! Destroys all data (volumes) — careful
nuke:
	docker compose down -v --rmi all
	@echo "💥 All containers, images and volumes removed"
