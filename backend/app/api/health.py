"""Health check endpoint."""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": getattr(request.app.state, 'model_loaded', False),
        "mode": getattr(request.app.state, 'mode', 'unknown'),
        "version": "0.1.0",
    }
