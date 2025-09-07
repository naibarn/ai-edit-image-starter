@echo off
setlocal
cd /d %~dp0

if not exist frontend (echo [ERROR] frontend folder not found & exit /b 1)

set API_BASE=%1
if "%API_BASE%"=="" set API_BASE=http://localhost:8000

echo [INFO] Frontend-only setup. API_BASE=%API_BASE%

cd frontend
npm i
npm i -D tailwindcss postcss autoprefixer
npm i clsx tailwind-merge lucide-react react-hook-form zod axios sonner

npx shadcn@latest init -y
npx shadcn@latest add button input textarea label card radio-group select slider switch tabs progress dialog separator scroll-area toast

if not exist .env.local (
  echo NEXT_PUBLIC_API_BASE=%API_BASE%> .env.local
  echo NEXT_PUBLIC_USE_QUEUE=false>> .env.local
) else (
  powershell -Command "(Get-Content .env.local ^| Where-Object {$_ -notmatch '^NEXT_PUBLIC_API_BASE='}) + 'NEXT_PUBLIC_API_BASE=%API_BASE%' ^| Set-Content .env.local"
)

if not exist public mkdir public
if not exist public\output mkdir public\output

echo [DONE] Frontend-only setup complete. Run: cd frontend && npm run dev
