"""
Evaluation metrics for ocean temperature reconstruction.

Computes overall, per-depth, and per-band metrics.
"""

import numpy as np
from typing import Dict, List, Optional
from ml.constants import STANDARD_DEPTHS, SURFACE_INDICES, THERMOCLINE_INDICES, DEEP_INDICES


def rmse(pred: np.ndarray, target: np.ndarray) -> float:
    """Root Mean Square Error."""
    return float(np.sqrt(np.nanmean((pred - target) ** 2)))


def mae(pred: np.ndarray, target: np.ndarray) -> float:
    """Mean Absolute Error."""
    return float(np.nanmean(np.abs(pred - target)))


def bias(pred: np.ndarray, target: np.ndarray) -> float:
    """Mean Bias (prediction - target)."""
    return float(np.nanmean(pred - target))


def correlation(pred: np.ndarray, target: np.ndarray) -> float:
    """Pearson correlation coefficient."""
    pred_flat = pred.flatten()
    target_flat = target.flatten()
    # Remove NaNs
    valid = ~(np.isnan(pred_flat) | np.isnan(target_flat))
    if valid.sum() < 2:
        return 0.0
    return float(np.corrcoef(pred_flat[valid], target_flat[valid])[0, 1])


def r_squared(pred: np.ndarray, target: np.ndarray) -> float:
    """Coefficient of determination (R²)."""
    ss_res = np.nansum((target - pred) ** 2)
    ss_tot = np.nansum((target - np.nanmean(target)) ** 2)
    if ss_tot < 1e-10:
        return 0.0
    return float(1.0 - ss_res / ss_tot)


def compute_overall_metrics(pred: np.ndarray, target: np.ndarray) -> Dict[str, float]:
    """
    Compute all overall metrics.
    
    Args:
        pred: (N, D, H, W) or (D, H, W) predictions
        target: same shape as pred
    """
    return {
        'rmse': rmse(pred, target),
        'mae': mae(pred, target),
        'bias': bias(pred, target),
        'correlation': correlation(pred, target),
        'r2': r_squared(pred, target),
    }


def compute_per_depth_metrics(
    pred: np.ndarray,
    target: np.ndarray,
    depths: Optional[List[float]] = None,
) -> Dict[str, Dict[str, float]]:
    """
    Compute metrics at each depth level.
    
    Args:
        pred: (..., D, H, W) predictions
        target: same shape
        depths: depth values for labeling
    """
    if depths is None:
        depths = STANDARD_DEPTHS

    # Ensure at least 3 dims: (D, H, W) or (N, D, H, W)
    if pred.ndim == 3:
        pred = pred[np.newaxis]
        target = target[np.newaxis]

    D = pred.shape[-3]
    results = {}

    for d in range(min(D, len(depths))):
        depth_str = f"{int(depths[d])}m"
        p = pred[:, d]
        t = target[:, d]
        results[depth_str] = {
            'rmse': rmse(p, t),
            'mae': mae(p, t),
            'bias': bias(p, t),
            'correlation': correlation(p, t),
        }

    return results


def compute_band_metrics(
    pred: np.ndarray,
    target: np.ndarray,
) -> Dict[str, Dict[str, float]]:
    """
    Compute metrics for each depth band.
    
    Bands:
        Surface:     0–50m
        Thermocline: 75–300m
        Deep:        500–1000m
    """
    if pred.ndim == 3:
        pred = pred[np.newaxis]
        target = target[np.newaxis]

    bands = {
        'surface': SURFACE_INDICES,
        'thermocline': THERMOCLINE_INDICES,
        'deep': DEEP_INDICES,
    }

    results = {}
    for band_name, indices in bands.items():
        p = pred[:, indices]
        t = target[:, indices]
        results[band_name] = {
            'rmse': rmse(p, t),
            'mae': mae(p, t),
            'correlation': correlation(p, t),
        }

    return results


def compute_all_metrics(
    pred: np.ndarray,
    target: np.ndarray,
) -> Dict:
    """Compute all metrics: overall, per-depth, per-band."""
    return {
        'overall': compute_overall_metrics(pred, target),
        'per_depth': compute_per_depth_metrics(pred, target),
        'bands': compute_band_metrics(pred, target),
    }


def physical_sanity_check(pred: np.ndarray) -> Dict[str, bool]:
    """
    Check if predictions are physically plausible.
    
    Returns dict of check_name → passed (True/False).
    """
    checks = {}
    
    # Temperature range check
    checks['temp_range_valid'] = bool(
        np.nanmin(pred) >= -5.0 and np.nanmax(pred) <= 40.0
    )

    # No extreme spatial discontinuities (>5°C between adjacent cells)
    if pred.ndim >= 2:
        lat_diff = np.abs(np.diff(pred, axis=-2))
        lon_diff = np.abs(np.diff(pred, axis=-1))
        checks['no_extreme_spatial_discontinuity'] = bool(
            np.nanmax(lat_diff) < 5.0 and np.nanmax(lon_diff) < 5.0
        )

    # NaN check
    nan_pct = np.isnan(pred).mean() * 100
    checks['nan_percentage'] = float(nan_pct)
    checks['acceptable_nan_level'] = bool(nan_pct < 10.0)

    return checks
