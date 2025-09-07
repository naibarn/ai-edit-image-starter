@echo off
setlocal ENABLEDELAYEDEXPANSION
set ROOT=%~dp0
pushd %ROOT%

where node >nul 2>nul || (echo [ERROR] Node.js not found & goto :END)
where npm  >nul 2>nul || (echo [ERROR] npm not found & goto :END)
where python >nul 2>nul || (echo [ERROR] Python not found & goto :END)

REM ----- Backend -----
if not exist backend (
  echo [WARN] backend folder not found — skip backend setup
  goto FRONTEND
)
pushd backend
if not exist .venv (
  echo [INFO] Creating Python venv
  python -m venv .venv
)
call .venv\Scripts\python -m pip install --upgrade pip
if not exist requirements.txt (
  > requirements.txt echo fastapi==0.112.2
  >> requirements.txt echo uvicorn[standard]==0.30.6
  >> requirements.txt echo python-dotenv==1.0.1
  >> requirements.txt echo requests==2.32.3
  >> requirements.txt echo python-multipart==0.0.9
  >> requirements.txt echo Pillow==10.4.0
)
call .venv\Scripts\pip install -r requirements.txt
if not exist .env (
  echo PROVIDER=openrouter> .env
  echo IMAGE_MODEL=google/gemini-2.5-flash-image-preview>> .env
  echo OPENROUTER_API_KEY=sk-or-...>> .env
  echo CORS_ALLOW_ORIGINS=http://localhost:3000>> .env
)
if not exist storage mkdir storage
if not exist storage\images mkdir storage\images
if not exist logs mkdir logs
popd

:FRONTEND
REM ----- Frontend -----
if not exist frontend (echo [ERROR] frontend folder not found & goto END)
pushd frontend
npm i
npm i -D tailwindcss postcss autoprefixer
npm i clsx tailwind-merge lucide-react react-hook-form zod axios sonner
npx shadcn@latest init -y
npx shadcn@latest add button input textarea label card radio-group select slider switch tabs progress dialog separator scroll-area toast
if not exist .env.local (
  echo NEXT_PUBLIC_API_BASE=http://localhost:8000> .env.local
  echo NEXT_PUBLIC_USE_QUEUE=false>> .env.local
)
if not exist public mkdir public
if not exist public\output mkdir public\output
popd

:END
popd
echo [DONE] Setup finished.
echo  - Backend: run_backend.bat
echo  - Frontend: run_frontend.bat
