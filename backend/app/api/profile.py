"""Profile endpoint — temperature profile at a specific point."""

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000]


@router.get("/profile")
async def get_profile(
    latitude: float = Query(..., description="Latitude (5-30°N)"),
    longitude: float = Query(..., description="Longitude (45-105°E)"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
):
    """
    Get temperature profile (depth vs temperature) at a point.
    
    Returns temperature, lower bound, and upper bound at 15 depths.
    """
    # Validate coordinates
    if not (5.0 <= latitude <= 30.0):
        raise HTTPException(status_code=400, detail=f"Latitude {latitude} out of range [5, 30]")
    if not (45.0 <= longitude <= 105.0):
        raise HTTPException(status_code=400, detail=f"Longitude {longitude} out of range [45, 105]")

    # TODO: Implement actual inference or demo data loading
    raise HTTPException(
        status_code=503,
        detail="Profile service not yet available. Model training in progress.",
    )
