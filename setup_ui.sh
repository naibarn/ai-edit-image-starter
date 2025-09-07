#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ----- Backend -----
if [ -d backend ]; then
  cd backend
  python3 -m venv .venv || python -m venv .venv
  . .venv/bin/activate
  python -m pip install --upgrade pip
  cat > requirements.txt <<'REQ'
fastapi==0.112.2
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
requests==2.32.3
python-multipart==0.0.9
Pillow==10.4.0
REQ
  pip install -r requirements.txt
  [ -f .env ] || cat > .env <<'ENV'
PROVIDER=openrouter
IMAGE_MODEL=google/gemini-2.5-flash-image-preview
OPENROUTER_API_KEY=sk-or-...
CORS_ALLOW_ORIGINS=http://localhost:3000
ENV
  mkdir -p storage/images logs
  deactivate || true
  cd ..
fi

# ----- Frontend -----
cd frontend
npm i
npm i -D tailwindcss postcss autoprefixer
npm i clsx tailwind-merge lucide-react react-hook-form zod axios sonner
npx shadcn@latest init -y || true
npx shadcn@latest add button input textarea label card radio-group select slider switch tabs progress dialog separator scroll-area toast || true
[ -f .env.local ] || { echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local; echo "NEXT_PUBLIC_USE_QUEUE=false" >> .env.local; }
mkdir -p public/output

echo "[DONE] Setup finished."
echo " - Backend: uvicorn backend/main:app --reload --port 8000 (after activating venv)"
echo " - Frontend: cd frontend && npm run dev"
