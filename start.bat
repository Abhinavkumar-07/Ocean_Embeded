@echo off
REM Local development: API on :8000. Run `npm run dev` in frontend\ for the UI on :5173.
venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
