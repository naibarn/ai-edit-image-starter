@echo off
setlocal
cd /d %~dp0
cd backend
if not exist .venv (echo [ERROR] .venv not found. Run setup_ui.bat first. & exit /b 1)
call .venv\Scripts\activate
set QUEUE_WORKERS=1
set QUEUE_POLL_SEC=1.0
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
