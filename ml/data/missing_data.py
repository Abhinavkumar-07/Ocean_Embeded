"""
Missing data handling for ocean observations.

Handles cloud contamination in SST, gaps in other variables,
and generates validity masks for the model.
"""

import numpy as np
import xarray as xr
from typing import Optional, Tuple
from scipy import ndimage


def create_validity_mask(data: np.ndarray) -> np.ndarray:
    """
    Create a binary validity mask.
    
    Returns:
        mask: same shape as data, 1 = valid, 0 = missing/NaN
    """
    return (~np.isnan(data)).astype(np.float32)


def spatial_interpolation(
    data: np.ndarray,
    mask: Optional[np.ndarray] = None,
    max_distance: int = 5,
) -> np.ndarray:
    """
    Fill missing values using spatial interpolation (distance-weighted).
    
    Uses scipy's distance_transform for nearest-neighbor interpolation.
    
    Args:
        data: 2D array (lat, lon) with NaN gaps
        mask: validity mask (1=valid, 0=missing)
        max_distance: maximum pixel distance for interpolation
    """
    if mask is None:
        mask = create_validity_mask(data)
    
    result = data.copy()
    missing = np.isnan(result)
    
    if not missing.any():
        return result
    
    # Use nearest valid value
    indices = ndimage.distance_transform_edt(
        missing, return_distances=False, return_indices=True
    )
    result = data[tuple(indices)]
    
    # Mask out points too far from valid data
    distances = ndimage.distance_transform_edt(missing)
    result[distances > max_distance] = np.nan
    
    return result


def temporal_interpolation(
    data_sequence: np.ndarray,
    axis: int = 0,
    max_gap: int = 3,
) -> np.ndarray:
    """
    Fill temporal gaps using linear interpolation.
    
    Args:
        data_sequence: (T, H, W) array with NaN gaps
        axis: temporal axis
        max_gap: maximum gap size to fill (in timesteps)
    """
    result = data_sequence.copy()
    T = result.shape[axis]
    
    if T < 2:
        return result
    
    # For each spatial point, interpolate in time
    for h in range(result.shape[1]):
        for w in range(result.shape[2]):
            series = result[:, h, w]
            valid_idx = np.where(~np.isnan(series))[0]
            
            if len(valid_idx) < 2:
                continue
            
            # Linear interpolation
            interp_vals = np.interp(
                np.arange(T),
                valid_idx,
                series[valid_idx],
            )
            
            # Only fill gaps shorter than max_gap
            nan_runs = _find_nan_runs(series)
            for start, length in nan_runs:
                if length <= max_gap:
                    result[start:start+length, h, w] = interp_vals[start:start+length]
    
    return result


def _find_nan_runs(arr: np.ndarray) -> list:
    """Find contiguous runs of NaN values. Returns [(start, length), ...]."""
    isnan = np.isnan(arr)
    runs = []
    i = 0
    while i < len(isnan):
        if isnan[i]:
            start = i
            while i < len(isnan) and isnan[i]:
                i += 1
            runs.append((start, i - start))
        else:
            i += 1
    return runs


def climatological_fallback(
    data: np.ndarray,
    climatology: Optional[np.ndarray] = None,
) -> np.ndarray:
    """
    Fill remaining NaNs with climatological mean.
    
    If no climatology is provided, uses the overall spatial mean.
    
    Args:
        data: array with NaN gaps
        climatology: same spatial shape as data
    """
    result = data.copy()
    
    if climatology is not None:
        # Fill NaNs with climatology
        missing = np.isnan(result)
        result[missing] = climatology[missing] if climatology.shape == result.shape else np.nan
    
    # Final fallback: spatial mean of valid values
    remaining_nan = np.isnan(result)
    if remaining_nan.any():
        spatial_mean = np.nanmean(result)
        if not np.isnan(spatial_mean):
            result[remaining_nan] = spatial_mean
    
    return result


def handle_missing_data(
    data: np.ndarray,
    method: str = 'full',
    max_spatial_distance: int = 5,
    max_temporal_gap: int = 3,
    climatology: Optional[np.ndarray] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Full missing data handling pipeline.
    
    Steps:
        1. Create validity mask (before any filling)
        2. Spatial interpolation
        3. Temporal interpolation (if 3D)
        4. Climatological fallback
    
    Args:
        data: (H, W) or (T, H, W) array with NaN gaps
        method: 'full' (all steps), 'spatial' (spatial only), 'none' (mask only)
        max_spatial_distance: max pixels for spatial interpolation
        max_temporal_gap: max timesteps for temporal interpolation
        climatology: optional climatological mean
    
    Returns:
        (filled_data, original_mask)
    """
    # Step 1: Create mask BEFORE filling
    original_mask = create_validity_mask(data)
    
    if method == 'none':
        return data, original_mask
    
    result = data.copy()
    
    # Step 2: Spatial interpolation
    if result.ndim == 2:
        result = spatial_interpolation(result, max_distance=max_spatial_distance)
    elif result.ndim == 3:
        for t in range(result.shape[0]):
            result[t] = spatial_interpolation(result[t], max_distance=max_spatial_distance)
    
    if method == 'spatial':
        return result, original_mask
    
    # Step 3: Temporal interpolation (only for 3D data)
    if result.ndim == 3:
        result = temporal_interpolation(result, max_gap=max_temporal_gap)
    
    # Step 4: Climatological fallback
    result = climatological_fallback(result, climatology)
    
    return result, original_mask
