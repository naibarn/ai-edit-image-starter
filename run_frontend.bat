@echo off
setlocal
cd /d %~dp0
cd frontend
@echo old = npm run dev

echo Starting Next.js development server...
echo start "Next.js Dev Server" cmd /c "npm run dev"

echo Waiting for server to start...


echo Running Playwright E2E tests...
npm run dev
timeout /t 10 /nobreak > nul