@echo off
setlocal
cd /d %~dp0
cd frontend

echo Starting Next.js development server...
start "Next.js Dev Server" cmd /c "npm run dev"

echo Waiting for server to start...
timeout /t 10 /nobreak > nul

echo Running Playwright E2E tests...
npm run test:e2e

echo Tests completed. Press any key to exit...
pause > nul
