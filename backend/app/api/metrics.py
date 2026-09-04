"""Metrics endpoint — model evaluation results."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/metrics")
async def get_metrics():
    """
    Get model evaluation metrics.
    
    Returns overall, per-depth, and per-band metrics.
    """
    # TODO: Load actual metrics from artifacts/metrics/
    return {
        "message": "No experiments have been run yet. Metrics will be available after model training.",
        "overall": None,
        "per_depth": None,
        "bands": None,
    }
