# NEXT TASK

**Current phase**: Phase 0 — Repository Initialization (completing)

**Task**: Set up Python environment, create ML module stubs, FastAPI backend skeleton, React+Vite frontend skeleton, YAML configs, test structure.

**Read**:
- CURRENT_STATUS.md
- ARCHITECTURE.md

**Expected output**:
- requirements.txt with all Python dependencies
- ml/ package with __init__.py files and module stubs
- backend/app/main.py with FastAPI health endpoint
- frontend/ initialized with React+Vite+TypeScript
- configs/*.yaml files
- tests/ with pytest structure

**Do not**:
- Download datasets yet
- Implement ML models yet
- Build frontend components yet

**Definition of done**:
- `pip install -r requirements.txt` succeeds
- `pytest tests/` runs (even if no tests yet)
- `uvicorn backend.app.main:app` starts and /health returns 200
- `npm run dev` in frontend/ starts dev server
