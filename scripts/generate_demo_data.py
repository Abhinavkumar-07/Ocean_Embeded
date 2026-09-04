"""
Generate synthetic demo data for UI development and testing.

Creates realistic-looking ocean temperature predictions
without requiring a trained model.

Usage:
    python scripts/generate_demo_data.py
"""

import json
import os
import sys

import numpy as np

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.constants import STANDARD_DEPTHS, DEV_DOMAIN


def generate_temperature_profile(lat: float, lon: float, depths: np.ndarray) -> dict:
    """
    Generate a physically plausible temperature profile.
    
    Uses a simplified exponential decay model:
    T(z) = T_deep + (T_surface - T_deep) * exp(-z / thermocline_depth)
    """
    # Surface temperature varies with latitude (warmer near equator)
    t_surface = 30.0 - 0.3 * (lat - 5.0) + np.random.normal(0, 0.5)
    t_deep = 4.0 + np.random.normal(0, 0.3)
    
    # Thermocline depth varies (deeper in subtropical regions)
    thermocline_depth = 80 + 20 * np.sin(np.radians(lat * 3)) + np.random.normal(0, 10)
    
    temperatures = t_deep + (t_surface - t_deep) * np.exp(-depths / thermocline_depth)
    
    # Add some noise
    noise = np.random.normal(0, 0.3, len(depths))
    temperatures = temperatures + noise
    
    # Uncertainty: larger in thermocline region
    uncertainty = 0.3 + 0.8 * np.exp(-((depths - thermocline_depth) ** 2) / (2 * 50**2))
    
    return {
        'temperature': temperatures.tolist(),
        'lower': (temperatures - 1.96 * uncertainty).tolist(),
        'upper': (temperatures + 1.96 * uncertainty).tolist(),
        'uncertainty': uncertainty.tolist(),
    }


def generate_spatial_field(
    lats: np.ndarray, lons: np.ndarray, depth: float
) -> dict:
    """Generate a 2D temperature field at a given depth."""
    LAT, LON = np.meshgrid(lats, lons, indexing='ij')
    
    # Base temperature pattern
    t_surface = 30.0 - 0.3 * (LAT - 5.0)
    t_deep = 4.0
    thermocline_depth = 80.0 + 20 * np.sin(np.radians(LAT * 3))
    
    temp = t_deep + (t_surface - t_deep) * np.exp(-depth / thermocline_depth)
    
    # Add spatial patterns (warm pool, cold upwelling)
    temp += 1.5 * np.sin(np.radians(LON * 2)) * np.cos(np.radians(LAT * 1.5))
    temp += np.random.normal(0, 0.2, temp.shape)
    
    # Uncertainty
    uncertainty = 0.3 + 0.5 * np.exp(-((depth - 100) ** 2) / 5000)
    unc_field = np.full_like(temp, uncertainty)
    
    return {
        'temperature': temp.tolist(),
        'uncertainty': unc_field.tolist(),
    }


def generate_demo_metrics() -> dict:
    """Generate realistic-looking evaluation metrics."""
    return {
        'overall': {
            'rmse': 0.82,
            'mae': 0.61,
            'bias': -0.04,
            'correlation': 0.97,
            'r2': 0.94,
        },
        'per_depth': {
            f'{int(d)}m': {
                'rmse': round(0.3 + 0.7 * np.exp(-((d - 120) ** 2) / 20000) + np.random.normal(0, 0.05), 2),
                'mae': round(0.2 + 0.5 * np.exp(-((d - 120) ** 2) / 20000) + np.random.normal(0, 0.03), 2),
            }
            for d in STANDARD_DEPTHS
        },
        'bands': {
            'surface': {'rmse': 0.42, 'mae': 0.31, 'correlation': 0.99},
            'thermocline': {'rmse': 1.08, 'mae': 0.82, 'correlation': 0.95},
            'deep': {'rmse': 0.55, 'mae': 0.41, 'correlation': 0.98},
        },
        'data_source': 'demo_precomputed',
        'note': 'These are synthetic demo metrics, not real experimental results.',
    }


def main():
    np.random.seed(42)
    
    demo_dir = "data/samples/demo"
    os.makedirs(demo_dir, exist_ok=True)
    
    domain = DEV_DOMAIN
    lats = np.arange(domain['lat_min'], domain['lat_max'] + 0.25, 0.25)
    lons = np.arange(domain['lon_min'], domain['lon_max'] + 0.25, 0.25)
    depths = STANDARD_DEPTHS
    
    # Generate demo locations profiles
    demo_locations = [
        {"name": "Bay of Bengal (Central)", "lat": 15.0, "lon": 88.0},
        {"name": "Bay of Bengal (North)", "lat": 20.0, "lon": 89.0},
        {"name": "Bay of Bengal (South)", "lat": 8.0, "lon": 85.0},
        {"name": "Near Sri Lanka", "lat": 7.0, "lon": 82.0},
    ]
    
    profiles = {}
    for loc in demo_locations:
        key = f"{loc['lat']}_{loc['lon']}"
        profile = generate_temperature_profile(loc['lat'], loc['lon'], depths)
        profiles[key] = {
            **loc,
            'depths': depths.tolist(),
            **profile,
            'date': '2020-02-15',
            'data_source': 'demo_precomputed',
        }
    
    with open(os.path.join(demo_dir, "profiles.json"), "w") as f:
        json.dump(profiles, f, indent=2)
    print(f"✓ Generated {len(profiles)} demo profiles")
    
    # Generate spatial fields at key depths
    predictions = {}
    for depth in [0, 50, 100, 200, 500, 1000]:
        field = generate_spatial_field(lats, lons, depth)
        predictions[str(depth)] = {
            'depth': depth,
            'date': '2020-02-15',
            'latitudes': lats.tolist(),
            'longitudes': lons.tolist(),
            **field,
            'data_source': 'demo_precomputed',
        }
    
    with open(os.path.join(demo_dir, "predictions.json"), "w") as f:
        json.dump(predictions, f, indent=2)
    print(f"✓ Generated spatial predictions at {len(predictions)} depth levels")
    
    # Generate demo metrics
    metrics = generate_demo_metrics()
    with open(os.path.join(demo_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    print("✓ Generated demo metrics")
    
    # Generate data quality info
    quality = {
        'date': '2020-02-15',
        'coverage': {
            'SST': 87.2,
            'SSS': 94.1,
            'SSH': 98.5,
            'current_u': 95.0,
            'current_v': 95.0,
            'wind_u': 99.1,
            'wind_v': 99.1,
        },
        'data_source': 'demo_precomputed',
    }
    with open(os.path.join(demo_dir, "quality.json"), "w") as f:
        json.dump(quality, f, indent=2)
    print("✓ Generated data quality info")
    
    print(f"\nDemo data saved to {demo_dir}/")
    print("Run the API in demo mode: APP_MODE=demo uvicorn backend.app.main:app")


if __name__ == "__main__":
    main()
