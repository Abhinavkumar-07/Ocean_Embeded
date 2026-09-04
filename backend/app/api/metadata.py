"""Metadata endpoint — model and domain information."""

from fastapi import APIRouter, Request

router = APIRouter()

DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000]
INPUT_VARIABLES = ["SST", "SSS", "SSH", "current_u", "current_v", "wind_u", "wind_v"]


@router.get("/metadata")
async def get_metadata(request: Request):
    """Return model and domain metadata."""
    return {
        "model_name": "OceanEmbed-v1",
        "architecture": "CNN+GRU",
        "embedding_dim": 128,
        "temporal_window": 7,
        "depths": DEPTHS,
        "region": {
            "lat_min": 5.0,
            "lat_max": 30.0,
            "lon_min": 45.0,
            "lon_max": 105.0,
        },
        "input_variables": INPUT_VARIABLES,
        "mode": getattr(request.app.state, 'mode', 'unknown'),
    }


@router.get("/grid")
async def get_grid():
    """Return grid coordinates for the domain."""
    import numpy as np
    lats = np.arange(5.0, 30.25, 0.25).tolist()
    lons = np.arange(45.0, 105.25, 0.25).tolist()
    return {
        "latitudes": lats,
        "longitudes": lons,
        "depths": DEPTHS,
    }
