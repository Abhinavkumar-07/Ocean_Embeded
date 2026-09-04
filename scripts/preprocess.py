"""
Preprocess raw ocean data into harmonized format.

Usage:
    python scripts/preprocess.py
"""

import argparse
import os
import sys

import yaml
import xarray as xr

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.data.adapters import MockSurfaceAdapter, MockSubsurfaceAdapter
from ml.data.quality import run_quality_control
from ml.data.harmonizer import harmonize_dataset
from ml.data.missing_data import handle_missing_data
from ml.constants import DOMAIN


def process_surface_data(raw_path: str, output_path: str):
    print("\n--- Processing Surface Data ---")
    adapter = MockSurfaceAdapter("surface")
    ds = adapter.load(raw_path)
    print(f"Loaded variables: {list(ds.data_vars)}")
    
    # Quality Control
    report = adapter.quality_control()
    print(report.summary())
    
    # Coordinate Normalization
    ds = adapter.normalize_coordinates()
    
    # Harmonization
    print("Harmonizing (subset, regrid, resample)...")
    ds = harmonize_dataset(ds, domain=DOMAIN, resolution=0.25)
    
    # Missing data handling (example for SST)
    print("Handling missing data...")
    for var in ds.data_vars:
        data = ds[var].values
        # Simple spatial fill for mock
        filled, mask = handle_missing_data(data, method='spatial')
        ds[var].values = filled
        # Add mask variable
        ds[f"{var}_mask"] = (ds[var].dims, mask)
        
    ds.to_netcdf(output_path)
    print(f"Saved harmonized surface data to {output_path}")


def process_subsurface_data(raw_path: str, output_path: str):
    print("\n--- Processing Subsurface Target Data ---")
    adapter = MockSubsurfaceAdapter("subsurface")
    ds = adapter.load(raw_path)
    print(f"Loaded variables: {list(ds.data_vars)}")
    
    # Quality Control
    report = adapter.quality_control()
    print(report.summary())
    
    # Coordinate Normalization
    ds = adapter.normalize_coordinates()
    
    # Harmonization
    print("Harmonizing (subset, regrid, resample)...")
    ds = harmonize_dataset(ds, domain=DOMAIN, resolution=0.25)
    
    # Missing data handling
    print("Handling missing data...")
    for var in ds.data_vars:
        if var == 'thetao':
            data = ds[var].values
            filled, mask = handle_missing_data(data, method='spatial')
            ds[var].values = filled
            ds[f"{var}_mask"] = (ds[var].dims, mask)
            
    ds.to_netcdf(output_path)
    print(f"Saved harmonized subsurface data to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Preprocess ocean data")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--output-dir", default="data/processed")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    
    surface_raw = os.path.join(args.raw_dir, "mock_surface_data.nc")
    subsurface_raw = os.path.join(args.raw_dir, "mock_subsurface_data.nc")
    
    surface_out = os.path.join(args.output_dir, "harmonized_surface.nc")
    subsurface_out = os.path.join(args.output_dir, "harmonized_subsurface.nc")
    
    if not os.path.exists(surface_raw) or not os.path.exists(subsurface_raw):
        print("ERROR: Raw mock data not found. Run 'python scripts/download_data.py --mock' first.")
        sys.exit(1)
        
    process_surface_data(surface_raw, surface_out)
    process_subsurface_data(subsurface_raw, subsurface_out)
    
    print("\nPreprocessing complete.")


if __name__ == "__main__":
    main()
