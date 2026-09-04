"""
Visualization tools for OceanEmbed evaluation.

Generates publication-quality figures for:
- RMSE by depth profile
- Predicted vs observed scatter
- Temperature profiles with uncertainty
- Spatial error maps
"""

import os
from typing import Dict, List, Optional

import numpy as np


def plot_rmse_by_depth(
    per_depth_metrics: Dict,
    depths: Optional[List[float]] = None,
    save_path: Optional[str] = None,
    title: str = "RMSE by Depth",
):
    """
    Plot RMSE as a function of depth.
    
    Args:
        per_depth_metrics: dict from compute_per_depth_metrics()
        depths: depth values
        save_path: path to save figure
        title: plot title
    """
    import matplotlib.pyplot as plt
    
    from ml.constants import STANDARD_DEPTHS
    if depths is None:
        depths = STANDARD_DEPTHS
    
    depth_labels = list(per_depth_metrics.keys())
    rmse_values = [per_depth_metrics[d]['rmse'] for d in depth_labels]
    depth_values = [float(d.replace('m', '')) for d in depth_labels]
    
    fig, ax = plt.subplots(figsize=(6, 8))
    ax.plot(rmse_values, depth_values, 'o-', color='#00d4ff', linewidth=2, markersize=6)
    
    # Shade depth bands
    ax.axhspan(0, 50, alpha=0.1, color='green', label='Surface')
    ax.axhspan(75, 300, alpha=0.1, color='orange', label='Thermocline')
    ax.axhspan(500, 1000, alpha=0.1, color='blue', label='Deep')
    
    ax.set_xlabel('RMSE (°C)', fontsize=12)
    ax.set_ylabel('Depth (m)', fontsize=12)
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.invert_yaxis()
    ax.grid(True, alpha=0.3)
    ax.legend(loc='lower right')
    
    plt.tight_layout()
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Saved: {save_path}")
    plt.close()


def plot_temperature_profile(
    depths: np.ndarray,
    predicted: np.ndarray,
    uncertainty: Optional[np.ndarray] = None,
    observed: Optional[np.ndarray] = None,
    save_path: Optional[str] = None,
    title: str = "Temperature Profile",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
):
    """
    Plot temperature profile with uncertainty band.
    
    Args:
        depths: (D,) depth values
        predicted: (D,) predicted temperatures
        uncertainty: (D,) uncertainty values (1-sigma)
        observed: (D,) observed temperatures (optional)
        save_path: path to save figure
    """
    import matplotlib.pyplot as plt
    
    fig, ax = plt.subplots(figsize=(6, 8))
    
    # Prediction line
    ax.plot(predicted, depths, 'o-', color='#00d4ff', linewidth=2,
            markersize=5, label='OceanEmbed', zorder=3)
    
    # Uncertainty band
    if uncertainty is not None:
        lower = predicted - 1.96 * uncertainty
        upper = predicted + 1.96 * uncertainty
        ax.fill_betweenx(depths, lower, upper, alpha=0.2, color='#00d4ff',
                         label='95% CI', zorder=2)
    
    # Observations
    if observed is not None:
        ax.plot(observed, depths, 's', color='#ff6b6b', markersize=7,
                label='Observed', zorder=4)
    
    ax.set_xlabel('Temperature (°C)', fontsize=12)
    ax.set_ylabel('Depth (m)', fontsize=12)
    ax.invert_yaxis()
    ax.grid(True, alpha=0.3)
    ax.legend(loc='lower left')
    
    loc_str = ""
    if lat is not None and lon is not None:
        loc_str = f" ({lat:.2f}°N, {lon:.2f}°E)"
    ax.set_title(f"{title}{loc_str}", fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Saved: {save_path}")
    plt.close()


def plot_scatter(
    predicted: np.ndarray,
    observed: np.ndarray,
    save_path: Optional[str] = None,
    title: str = "Predicted vs Observed",
):
    """Scatter plot of predicted vs observed temperatures."""
    import matplotlib.pyplot as plt
    
    fig, ax = plt.subplots(figsize=(7, 7))
    
    pred_flat = predicted.flatten()
    obs_flat = observed.flatten()
    
    # Remove NaNs
    valid = ~(np.isnan(pred_flat) | np.isnan(obs_flat))
    pred_flat = pred_flat[valid]
    obs_flat = obs_flat[valid]
    
    ax.scatter(obs_flat, pred_flat, alpha=0.1, s=1, color='#00d4ff')
    
    # 1:1 line
    vmin = min(pred_flat.min(), obs_flat.min())
    vmax = max(pred_flat.max(), obs_flat.max())
    ax.plot([vmin, vmax], [vmin, vmax], 'r--', linewidth=1, label='1:1')
    
    ax.set_xlabel('Observed Temperature (°C)', fontsize=12)
    ax.set_ylabel('Predicted Temperature (°C)', fontsize=12)
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_aspect('equal')
    
    plt.tight_layout()
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Saved: {save_path}")
    plt.close()


def plot_band_comparison(
    band_metrics: Dict,
    model_names: Optional[List[str]] = None,
    save_path: Optional[str] = None,
    title: str = "RMSE by Depth Band",
):
    """Bar chart comparing RMSE across depth bands."""
    import matplotlib.pyplot as plt
    
    bands = list(band_metrics.keys())
    rmse_vals = [band_metrics[b]['rmse'] for b in bands]
    
    colors = ['#00c853', '#ffab00', '#2196f3']
    
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(bands, rmse_vals, color=colors[:len(bands)], edgecolor='white', linewidth=0.5)
    
    for bar, val in zip(bars, rmse_vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
                f'{val:.3f}', ha='center', va='bottom', fontweight='bold')
    
    ax.set_ylabel('RMSE (°C)', fontsize=12)
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Saved: {save_path}")
    plt.close()
