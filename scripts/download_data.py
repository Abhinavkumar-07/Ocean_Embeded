"""
Data download script for OceanEmbed.

Connects to Copernicus Marine Environment Monitoring Service (CMEMS)
to download requested datasets for the target region and time period.

Supports generating synthetic NetCDF files if CMEMS is unavailable or
credentials are not configured.

Usage:
    python scripts/download_data.py --mock
"""

import argparse
import os
import sys
from datetime import datetime, timedelta

import numpy as np
import xarray as xr

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.constants import DOMAIN, NUM_DEPTHS, STANDARD_DEPTHS, NUM_INPUT_CHANNELS


def generate_mock_netcdf(output_dir: str, dataset_type: str, domain: dict, n_days: int = 30):
    """
    Generate synthetic NetCDF files for testing the pipeline when CMEMS is unavailable.
    """
    print(f"Generating mock {dataset_type} dataset...")
    
    # Create coordinate arrays
    lons = np.arange(domain['lon_min'], domain['lon_max'] + 0.25, 0.25)
    lats = np.arange(domain['lat_min'], domain['lat_max'] + 0.25, 0.25)
    times = [datetime(2023, 1, 1) + timedelta(days=i) for i in range(n_days)]
    
    H = len(lats)
    W = len(lons)
    T = len(times)
    
    if dataset_type == "surface":
        # Surface variables (SST, SSS, SSH, U, V, Wind_U, Wind_V)
        data_vars = {
            'sst': (['time', 'lat', 'lon'], 25.0 + np.random.randn(T, H, W) * 2),
            'sss': (['time', 'lat', 'lon'], 35.0 + np.random.randn(T, H, W) * 0.5),
            'ssh': (['time', 'lat', 'lon'], 0.0 + np.random.randn(T, H, W) * 0.1),
            'u': (['time', 'lat', 'lon'], np.random.randn(T, H, W) * 0.5),
            'v': (['time', 'lat', 'lon'], np.random.randn(T, H, W) * 0.5),
            'wind_u': (['time', 'lat', 'lon'], np.random.randn(T, H, W) * 5),
            'wind_v': (['time', 'lat', 'lon'], np.random.randn(T, H, W) * 5),
        }
        filename = "mock_surface_data.nc"
        
    elif dataset_type == "subsurface":
        # Target variable (Subsurface Temperature)
        depths = STANDARD_DEPTHS
        D = len(depths)
        
        # Temperature decreases with depth
        temp_data = np.zeros((T, D, H, W))
        for d in range(D):
            base_temp = max(4.0, 28.0 - d * 1.5)
            temp_data[:, d, :, :] = base_temp + np.random.randn(T, H, W) * 0.5
            
        data_vars = {
            'thetao': (['time', 'depth', 'lat', 'lon'], temp_data)
        }
        
        filename = "mock_subsurface_data.nc"
        
    else:
        raise ValueError(f"Unknown mock dataset type: {dataset_type}")
        
    # Create xarray dataset
    coords = {
        'time': times,
        'lat': lats,
        'lon': lons,
    }
    
    if dataset_type == "subsurface":
        coords['depth'] = depths
        
    ds = xr.Dataset(data_vars=data_vars, coords=coords)
    
    # Save to file
    filepath = os.path.join(output_dir, filename)
    ds.to_netcdf(filepath)
    print(f"Saved mock dataset to {filepath}")
    return filepath


def download_cmems_data(config_name: str, output_dir: str):
    """
    Actual CMEMS download logic using copernicusmarine client.
    Requires credentials.
    """
    import yaml
    
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'configs', 'datasets.yaml')
    with open(config_path, 'r') as f:
        datasets_config = yaml.safe_load(f).get('datasets', {})
        
    if config_name not in datasets_config:
        print(f"ERROR: Dataset '{config_name}' not found in datasets.yaml")
        return False
        
    ds_config = datasets_config[config_name]
    dataset_id = ds_config.get('dataset_id')
    variables = list(ds_config.get('variable_mapping', {}).keys())
    
    print(f"\nAttempting to download {config_name} from CMEMS...")
    print(f"Dataset ID: {dataset_id}")
    print(f"Variables: {variables}")
    
    try:
        import copernicusmarine
    except ImportError:
        print("ERROR: copernicusmarine package is not installed.")
        print("Run with --mock to generate synthetic data for testing.")
        return False
        
    print("Checking CMEMS credentials...")
    try:
        copernicusmarine.login()
        
        # Bay of Bengal Jan 2022 subset
        print(f"Downloading Bay of Bengal subset for Jan 2022...")
        
        # We specify minimum necessary parameters to prevent downloading globally.
        copernicusmarine.subset(
            dataset_id=dataset_id,
            variables=variables,
            minimum_longitude=80.0,
            maximum_longitude=95.0,
            minimum_latitude=10.0,
            maximum_latitude=20.0,
            start_datetime="2022-01-01T00:00:00",
            end_datetime="2022-01-31T23:59:59",
            minimum_depth=0.0,
            maximum_depth=1000.0,
            output_directory=output_dir,
            output_filename=f"{config_name}_bob_jan2022.nc",
            force_download=True
        )
        print(f"✅ Successfully downloaded {config_name} subset to {output_dir}")
        return True
    except Exception as e:
        print(f"❌ CMEMS Authentication or download failed: {e}")
        print("Please configure your credentials using 'copernicusmarine login'")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download Ocean Data")
    parser.add_argument("--mock", action="store_true", help="Generate synthetic NetCDF files instead of downloading")
    parser.add_argument("--dataset", choices=["glorys", "ostia", "smos", "altimetry", "ascat", "globcurrent"], default="glorys", help="Which dataset to download (default: glorys)")
    parser.add_argument("--output", default="data/raw", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    
    if args.mock:
        print("Running in MOCK mode. Generating synthetic NetCDF files.")
        generate_mock_netcdf(args.output, "surface", DOMAIN)
        generate_mock_netcdf(args.output, "subsurface", DOMAIN)
        print("\nDataset generation complete.")
        print(f"Files saved in: {os.path.abspath(args.output)}")
    else:
        success = download_cmems_data(args.dataset, args.output)
        if not success:
            print("\nTo continue development without CMEMS credentials, run:")
            print("  python scripts/download_data.py --mock")
            sys.exit(1)


if __name__ == "__main__":
    main()
