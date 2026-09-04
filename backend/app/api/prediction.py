"""Prediction endpoint — spatial temperature field at a given depth and date."""

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


@router.get("/prediction")
async def get_prediction(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    depth: float = Query(..., description="Depth in meters"),
    lat_min: float = Query(5.0, description="Minimum latitude"),
    lat_max: float = Query(30.0, description="Maximum latitude"),
    lon_min: float = Query(45.0, description="Minimum longitude"),
    lon_max: float = Query(105.0, description="Maximum longitude"),
):
    """
    Get spatial temperature prediction at a given depth and date.
    
    Returns a 2D temperature field over the specified region.
    """
    # TODO: Implement actual inference or demo data loading
    raise HTTPException(
        status_code=503,
        detail="Prediction service not yet available. Model training in progress.",
    )
