# QuickStart — AI Image Edit Starter (Next.js + FastAPI + shadcn/ui)

> A **step‑by‑step** guide to install, run, and verify this project on your machine — both **Full‑stack (Frontend + Backend)** and **Frontend‑only** modes.

---

## 1) Prerequisites

Make sure you have the following (same or newer versions):

* **Node.js LTS ≥ 18** → check with `node -v`
* **npm** → `npm -v`
* **Python ≥ 3.10** → `python --version` or `python3 --version`
* **Git** (if you plan to clone the repo)
* Free disk space \~ **2–3GB**

> If something is missing, install Node.js LTS and Python for your OS first.

---

## 2) Directory Layout

The project typically looks like this:

```
my-app/
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ .env.example            # example env (copy to .env)
│  ├─ logs/                   # created automatically when running
│  └─ storage/
│     └─ images/              # backend-side output files
└─ frontend/
   ├─ app/
   │  └─ edit/page.tsx        # main page for edit/generate
   ├─ components/ui/          # shadcn/ui + sonner components
   ├─ public/
   │  └─ output/              # generated files (served by Next.js)
   └─ .env.local.example      # example UI env

setup_ui.bat                  # first-time setup (Windows) — Frontend + Backend
setup_ui.sh                   # first-time setup (macOS/Linux)
setup_frontend_only.bat       # setup only Frontend (Windows)
setup_frontend_only.sh        # setup only Frontend (macOS/Linux)
run_backend.bat               # run Backend (Windows)
run_frontend.bat              # run Frontend (Windows)
```

> Your tree does not have to be identical, but `backend/` and `frontend/` should exist.

---

## 3) Choose Your Mode

Pick one of the two:

### Option A — **Full‑stack (install Frontend + Backend on the same machine)**

Best for developers running both sides locally.

### Option B — **Frontend‑only (install just the UI and point to a remote Backend)**

Best for teams with a shared backend or those who prefer not to install Python locally.

---

## 4) Environment Configuration

### 4.1 Backend (`backend/.env`)

Copy `.env.example` to `.env` and fill in your **API keys**:

```env
# Provider selection
PROVIDER=openrouter          # openrouter | gemini-direct | auto
IMAGE_MODEL=google/gemini-2.5-flash-image-preview

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxx

# Gemini direct (optional)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash

# Queue (optional)
QUEUE_WORKERS=1
QUEUE_POLL_SEC=1.0

# CORS
CORS_ALLOW_ORIGINS=http://localhost:3000
```

> Start with `PROVIDER=openrouter` and a valid `OPENROUTER_API_KEY`.

### 4.2 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_USE_QUEUE=false
```

* `NEXT_PUBLIC_API_BASE` is the Backend URL the UI talks to.
* For **Frontend‑only**, set it to the remote backend URL, e.g. `https://api.example.com`.

---

## 5) One‑time Setup

> Run these from the **project root** (`my-app/`).

### Windows

```bat
:: Setup Frontend + Backend
./setup_ui.bat
```

or **Frontend‑only**:

```bat
./setup_frontend_only.bat https://your-backend.example.com
```

### macOS / Linux

```bash
# Make scripts executable and run full setup
chmod +x ./setup_ui.sh
./setup_ui.sh
```

or **Frontend‑only**:

```bash
chmod +x ./setup_frontend_only.sh
./setup_frontend_only.sh https://your-backend.example.com
```

> The scripts create a Python `.venv`, install dependencies, initialize shadcn/ui, and ensure `public/output` exists.

---

## 6) Run Servers (Development)

Open **two** terminals (one for Backend, one for Frontend).

### 6.1 Backend (FastAPI)

**Windows**

```bat
cd backend
./.venv/Scripts/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**macOS/Linux**

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 6.2 Frontend (Next.js)

```bash
cd frontend
npm run dev
# Open: http://localhost:3000/edit
```

---

## 7) Smoke Test (3‑minute sanity check)

### 7.1 Backend Health

* Open `http://localhost:8000/` → you should see a JSON status.
* List images (likely empty at first):

  ```bash
  curl http://localhost:8000/images
  # Expect [] when no files exist yet
  ```

### 7.2 UI Test

1. Navigate to `http://localhost:3000/edit`
2. Upload a **Base Image**
3. Optionally add **References** (1–7) and/or a **Mask (PNG/alpha)**
4. Set Mode/Preset/size/format/quantity
5. Click **Generate / Edit**
6. Watch toast + progress; results appear in the grid with **Download** links

### 7.3 Verify Output Files

* Frontend side: `frontend/public/output/*.png|webp|jpg`
* Backend side: `backend/storage/images/*.png|webp|jpg`
* Backend static URL: `http://localhost:8000/static/images/<filename>`

---

## 8) Frontend‑only Mode (no local Backend)

1. Run `setup_frontend_only.(bat|sh)` with your remote backend URL
2. Set `frontend/.env.local` → `NEXT_PUBLIC_API_BASE=https://your-backend.example.com`
3. Run `npm run dev` in `frontend`
4. Ensure the remote Backend **allows CORS** for your UI domain

---

## 9) Troubleshooting (common issues)

| Symptom                     | Likely Cause                                | Quick Fix                                                                                  |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **CORS error** in Console   | `CORS_ALLOW_ORIGINS` missing your UI domain | Add `http://localhost:3000` (and your real domain) in `backend/.env`, then restart backend |
| No image / 401/403          | Invalid or insufficient provider key        | Check `OPENROUTER_API_KEY` / `GEMINI_API_KEY` in `backend/.env`                            |
| 404 at `/static/images/...` | No files yet or wrong path                  | Generate again; confirm `/static` mount and files under `storage/images`                   |
| UI shows nothing            | Wrong `NEXT_PUBLIC_API_BASE`                | Fix the value in `frontend/.env.local`                                                     |
| Queue is slow               | Too few workers / provider quota            | Increase `QUEUE_WORKERS`; try smaller `width/height` and lower `n`                         |

> Still stuck? Check `backend/logs/app.log` (if available) and your browser Network tab for detailed errors.

---

## 10) Testing (optional but recommended)

### Backend — Pytest

```bash
pip install pytest pytest-asyncio httpx
cd backend && pytest -q
```

* Example folder: `backend/tests/`
* Core tests: `/images/generate`, `/images/edit`, `/images`, logging, queue (if enabled)

### Frontend — Vitest + Testing Library

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
cd frontend && npm run test
```

* Example folder: `frontend/tests/`
* Core tests: upload/validation, presets/controls, toasts/progress/gallery

---

## 11) Frequently Used Commands (Cheat‑sheet)

```bash
# Backend
cd backend
source .venv/bin/activate        # Windows: ./.venv/Scripts/activate
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev

# Temporarily change Frontend port
PORT=3001 npm run dev
```

---

## 12) Security & Config

* Keep **API keys** in `.env` files only. Never commit them.
* Restrict **CORS** to necessary domains before production.
* Consider upload **timeout/size limits** appropriate to your environment.

---

## 13) License & SPDX

* Project is licensed under **MIT** → see [`LICENSE`](./LICENSE)
* Planned SPDX header for source files (machine‑readable): `SPDX-License-Identifier: MIT`
  *(will be rolled out later — track in README/Backlog)*

---

## 14) Next Steps

* Try **Presets** (Blur Background / Change Clothes / Remove Object)
* Use a **Mask (PNG/alpha)** for inpainting specific regions
* Enable the **Queue** when multiple machines submit jobs concurrently
* Switch **Providers** via `.env` or per‑request `provider`
* See [`backlog.md`](./backlog.md) for the work plan and [`architecture.md`](./architecture.md) for the system design

---

## 15) Appendix: Sample .env Files

**`backend/.env`**

```env
PROVIDER=openrouter
IMAGE_MODEL=google/gemini-2.5-flash-image-preview
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxx
CORS_ALLOW_ORIGINS=http://localhost:3000
QUEUE_WORKERS=1
QUEUE_POLL_SEC=1.0
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_USE_QUEUE=false
```

---

> That’s it! For deeper details, see `README.md` (overview), `prd.md` (requirements), `architecture.md` (structure), and `backlog.md` (plan/status).
