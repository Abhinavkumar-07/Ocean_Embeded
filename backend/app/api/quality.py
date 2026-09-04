"""Data quality endpoint — satellite data coverage information."""

from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/data-quality")
async def get_data_quality(
    date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """
    Get satellite data quality/coverage information.
    
    Returns coverage percentage for each input variable.
    """
    # TODO: Load actual quality metrics
    return {
        "message": "Data quality assessment not yet performed.",
        "date": date,
        "coverage": None,
    }
