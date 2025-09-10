@echo off

REM Setup script for frontend-only mode (Windows)
REM Creates necessary directories and .env.local for local development without backend

echo Setting up frontend-only mode...

REM Create output directory if it doesn't exist
if not exist "public\output" mkdir "public\output"

REM Create .env.local with API base URL
(
echo # Frontend-only configuration
echo # Set this to your backend API URL when running with backend
echo NEXT_PUBLIC_API_BASE=http://localhost:8000
) > .env.local

echo Frontend-only setup complete!
echo - Created public\output directory
echo - Created .env.local with NEXT_PUBLIC_API_BASE=http://localhost:8000
echo.
echo To run frontend-only:
echo 1. npm install
echo 2. npm run dev
echo.
echo Note: You'll need to run the backend separately on port 8000
pause