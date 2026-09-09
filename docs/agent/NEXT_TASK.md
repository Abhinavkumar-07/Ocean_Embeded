# NEXT TASK

## Current Phase
Phase 8: Data & ML Foundation Audit (Step 2: Dataset schema + adapters)

## Exact Next Steps
1. Create a clean dataset adapter abstraction (`ml/data/adapters.py` or similar).
2. The architecture should allow GLORYS, ARGO, and satellite datasets to be loaded through documented adapters.
3. Define explicit schemas for surface input, target temperature, etc.
4. Establish QC framework for missing values without silently dropping them.

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

- Evaluate Phase 7 (Model & Embeddings, Analysis & Insights).
