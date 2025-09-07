#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

API_BASE="${1:-http://localhost:8000}"
echo "[INFO] Frontend-only setup. API_BASE=$API_BASE"

cd frontend
npm i
npm i -D tailwindcss postcss autoprefixer
npm i clsx tailwind-merge lucide-react react-hook-form zod axios sonner

npx shadcn@latest init -y || true
npx shadcn@latest add button input textarea label card radio-group select slider switch tabs progress dialog separator scroll-area toast || true

if [ ! -f .env.local ]; then
  echo "NEXT_PUBLIC_API_BASE=$API_BASE" > .env.local
  echo "NEXT_PUBLIC_USE_QUEUE=false" >> .env.local
else
  grep -v '^NEXT_PUBLIC_API_BASE=' .env.local > .env.local.tmp || true
  echo "NEXT_PUBLIC_API_BASE=$API_BASE" >> .env.local.tmp
  mv .env.local.tmp .env.local
fi

mkdir -p public/output
echo "[DONE] Frontend-only setup complete. Run: cd frontend && npm run dev"
