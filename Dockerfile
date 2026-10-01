# OceanEmbed — single-container image for Google Cloud Run.
# Stage 1 builds the React frontend; stage 2 runs FastAPI, which serves both
# the API (/api/v1/*) and the built frontend from the same origin.

# ---------- Stage 1: frontend build ----------
FROM node:20-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: API runtime ----------
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080
WORKDIR /app

# CPU-only PyTorch keeps the image ~1 GB smaller than the default CUDA build.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements-serve.txt ./
RUN pip install -r requirements-serve.txt

COPY ml/ ml/
COPY backend/ backend/
COPY configs/ configs/
# Model artifacts: norm_stats.npz is in git; best_model.pt is baked in only if present
# locally (otherwise point MODEL_CHECKPOINT at a gs:// URI at deploy time).
COPY artifacts/ artifacts/
# One test window is used as the demo input for inference.
COPY data/samples/test/ data/samples/test/
COPY --from=frontend /frontend/dist frontend/dist

RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
