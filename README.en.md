# \AI Image Edit Starter

> Monorepo: **Next.js (Frontend)** + **FastAPI (Backend)**, designed **local-first**. Quick to run on a single machine, easy to extend, MIT-licensed.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#) [![Tests](https://img.shields.io/badge/tests-ready-brightgreen)](#) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of Contents

* [Demo / Screenshots](#demo--screenshots)
* [Features](#features)
* [Architecture & Tech Stack](#architecture--tech-stack)
* [File Structure](#file-structure)
* [Quickstart (TL;DR)](#quickstart-tldr)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)
* [Development Scripts](#development-scripts)
* [Testing](#testing)
* [Deployment](#deployment)
* [Extending & Best Practices](#extending--best-practices)
* [Troubleshooting & FAQ](#troubleshooting--faq)
* [Security](#security)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [Changelog](#changelog)
* [License](#license)
* [Maintainers & Contact](#maintainers--contact)

---

## Demo / Screenshots

* Demo URL (optional): `<DEMO_URL>`
* Main screenshot:

![screenshot](./docs/assets/screenshot.png)

> Keep all images in `docs/assets/*` for clarity.

---

## Features

* ✅ **Local-first**: Run FE/BE on the same machine with minimal setup
* ⚡ **Next.js App Router + FastAPI**: clean architecture, auto-generated API docs (Swagger/Redoc)
* 🔌 **CORS** pre-configured for `http://localhost:3000`
* 🧩 **Layered backend**: router → service → repository
* 🧪 **Testing ready**: Vitest/Playwright (FE), Pytest (BE)
* 🐳 **Docker Compose** (optional) for one-command run

> Non-goals (for now): multi-tenant/HA (this template focuses on local usage first)

---

## Architecture & Tech Stack

```
[Next.js Frontend :3000] ↔ [FastAPI Backend :8000] → [SQLite (local file)]
```

* Frontend: Next.js (App Router), React, fetch/axios
* Backend: FastAPI, Uvicorn, Pydantic, SQLModel/SQLAlchemy, SQLite (default)
* Testing: Vitest + Playwright (FE), Pytest (BE)
* Tooling: ESLint/Prettier, Ruff/Black

```mermaid
flowchart LR
  A[Next.js] -- REST --> B(FastAPI)
  B --> C[(SQLite)]
```

---

## File Structure

```
.
├── frontend/                  # Next.js app
│   ├── src/app/               # App Router
│   ├── src/components/
│   ├── src/lib/
│   ├── public/
│   ├── package.json
│   ├── .env.local.example
│   └── next.config.mjs
├── backend/                   # FastAPI app
│   ├── app/
│   │   ├── main.py            # entrypoint
│   │   ├── api/v1/            # routers
│   │   ├── core/              # config/security
│   │   ├── models/            # SQLModel/SQLAlchemy
│   │   ├── schemas/           # Pydantic models
│   │   └── services/          # business logic
│   ├── tests/
│   ├── requirements.txt       # or pyproject.toml
│   └── .env.example
├── docs/
│   ├── assets/
│   └── architecture.md
├── docker-compose.yml
├── Makefile
├── .gitignore
├── .env.example               # shared env (optional)
└── README.md
```

**Highlights**

* `frontend/` calls the API using `NEXT_PUBLIC_API_BASE_URL`
* `backend/` serves docs at `/docs` (Swagger) and `/redoc`

---

## Quickstart (TL;DR)

```bash
# 1) Clone
git clone <REPO_URL> && cd <PROJECT_NAME>

# 2) Create env files from examples
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3) Run locally (no Docker)
# 3.1 Backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000

# 3.2 Frontend (new terminal)
cd frontend
pnpm install  # or npm i / yarn
pnpm dev

# Open http://localhost:3000 (FE) and http://localhost:8000/docs (API docs)
```

<details>
<summary>Alternative: Docker Compose</summary>

```bash
docker compose up -d --build
# FE: http://localhost:3000
# BE: http://localhost:8000/docs
```

</details>

---

## Installation

### Prerequisites

* Node.js ≥ 18 (pnpm recommended; npm/yarn OK)
* Python ≥ 3.10
* (Optional) Docker & Docker Compose

### Install dependencies

```bash
# Frontend
cd frontend && pnpm install && cd ..
# Backend
python -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt
```

---

## Configuration

### `backend/.env`

```dotenv
APP_NAME=<PROJECT_NAME>
APP_PORT=8000
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./data.db   # local-first default (SQLite)
SECRET_KEY=change_me
```

### `frontend/.env.local`

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

> Want PostgreSQL? Set `DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/db` and add a `db` service in `docker-compose.yml`.

---

## Usage

### Start dev servers

* Frontend: `cd frontend && pnpm dev`
* Backend: `uvicorn backend.app.main:app --reload --port 8000`

### Sample API calls

```bash
# Health
curl http://localhost:8000/api/v1/health

# Create user
curl -X POST http://localhost:8000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"123456"}'
```

> Full API docs: `http://localhost:8000/docs` (Swagger) or `/redoc`.

---

## Development Scripts

**`frontend/package.json` (example):**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

**`backend/Makefile` (example):**

```makefile
.PHONY: dev test fmt lint

dev:
	uvicorn backend.app.main:app --reload --port 8000

test:
	pytest -q

fmt:
	black backend && ruff check backend --fix

lint:
	ruff check backend && mypy backend
```

**Team workflow (suggested):**

1. Branch from `main` using `feat/<short-summary>`
2. Conventional Commits, e.g. `feat: add login api`
3. Make `lint` + `test` pass before opening a PR
4. Attach screenshots/demo for UI changes

---

## Testing

**Frontend**

```bash
cd frontend
pnpm test        # unit
pnpm e2e         # e2e (first-time: pnpm dlx playwright install)
```

**Backend**

```bash
pytest -q
coverage run -m pytest && coverage html  # report at htmlcov/index.html
```

---

## Deployment

> Local-first template, but Docker Compose is provided for convenience.

**`docker-compose.yml` (SQLite default):**

```yaml
version: '3.9'
services:
  backend:
    build: ./backend
    command: uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
    ports: ["8000:8000"]
    env_file: backend/.env
    volumes:
      - ./backend:/app
      - ./data:/app/data
  frontend:
    build: ./frontend
    command: pnpm dev --port 3000
    ports: ["3000:3000"]
    env_file: frontend/.env.local
    volumes:
      - ./frontend:/app
```

<details>
<summary>Add PostgreSQL (optional)</summary>

```yaml
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Update `DATABASE_URL` in `backend/.env` accordingly.

</details>

---

## Extending & Best Practices

* Keep this README as the **single source of truth** (update whenever behavior changes)
* Separate configuration from code with `.env`, validate via **Pydantic/Zod**
* Backend layering: **router → service → repo** for testability
* Default to **SQLite** for local-first; swap to PostgreSQL when needed
* Provide **copy-paste-able** examples (API/CLI) for every important feature
* Expose **Extension Points**, e.g. webhooks or plugin interfaces

**Extension points (examples)**

* Webhook: `POST /api/v1/events` (e.g., `user.created`, `item.added`)
* Frontend SDK: `src/lib/api.ts` centralizes API calls

---

## Troubleshooting & FAQ

**Q:** CORS error from FE to BE?
**A:** Check `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`.

**Q:** Port already in use?
**A:** Change BE port in `.env`, or run FE with `pnpm dev --port 4000`.

**Q:** SQLite database locked?
**A:** Stop stale processes, or switch DB file (`DATABASE_URL=sqlite:///./dev.db`).

---

## Security

* Never commit real secrets or `.env` files (commit `.env.example` only)
* Enable Dependabot/Renovate for dependency security updates
* Report vulnerabilities via `<SECURITY_CONTACT>` or a `SECURITY.md`

---

## Roadmap

* [ ] Full auth flow (register/login/reset)
* [ ] Example CRUD module with tests
* [ ] Playwright e2e example

---

## Contributing

* See `CONTRIBUTING.md`, follow Conventional Commits
* Each PR should include tests and (if UI) screenshots

---

## Changelog

Follow `CHANGELOG.md` (Keep a Changelog + SemVer)

---

## License

Released under the **MIT License** — free to use, modify, distribute, and commercialize, with the original copyright notice retained. See `LICENSE`.

**MIT (short form):**

```
MIT License

Copyright (c) <YEAR> <YOUR_NAME>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[...full MIT text...]
```

---

## Maintainers & Contact

* Name: `<YOUR_NAME>` — Email: `<YOU@EXAMPLE.COM>`
* Channels: GitHub Issues/Discussions

---

### Appendix

**Auto-generate directory tree:**

```bash
# macOS/Linux
brew install tree || sudo apt-get install tree

tree -I 'node_modules|.git|dist|coverage|.next' -L 3 > docs/structure.txt
```

**Related links:**

* `http://localhost:8000/docs` — Swagger Docs
* `docs/architecture.md` — Architecture notes
* `.github/workflows/ci.yml` — CI (optional)

> Tip: make “**start in 5 minutes**” real with copy-paste-able commands for both FE and BE.
