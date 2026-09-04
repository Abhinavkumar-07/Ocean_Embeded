"""
Create training samples from harmonized data.

Usage:
    python scripts/create_samples.py
"""

import argparse
import os
import sys

import numpy as np
import xarray as xr

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.constants import NUM_INPUT_CHANNELS, NUM_DEPTHS


def create_split_samples(
    surface_ds: xr.Dataset,
    subsurface_ds: xr.Dataset,
    output_dir: str,
    temporal_window: int = 7,
):
    """
    Generate overlapping temporal window samples and save as .npz files.
    """
    # Ensure times align
    common_times = np.intersect1d(surface_ds.time.values, subsurface_ds.time.values)
    surface_ds = surface_ds.sel(time=common_times)
    subsurface_ds = subsurface_ds.sel(time=common_times)
    
    total_days = len(common_times)
    print(f"Total overlapping days available: {total_days}")
    
    if total_days < temporal_window:
        raise ValueError(f"Not enough data for window size {temporal_window}. Only {total_days} days available.")

    # Convert to numpy arrays for faster slicing
    # surface shape: (T, C, H, W)
    var_list = ['sst', 'sss', 'ssh', 'u', 'v', 'wind_u', 'wind_v']
    surface_data = np.stack([surface_ds[v].values for v in var_list], axis=1)
    
    # subsurface shape: (T, D, H, W)
    subsurface_data = subsurface_ds['thetao'].values
    
    # We will use the mask from SST for the whole surface
    mask_data = surface_ds['sst_mask'].values
    mask_data = np.expand_dims(mask_data, axis=1) # (T, 1, H, W)

    # Train/Val/Test Split (Temporal)
    # Simple split: first 70% train, next 15% val, last 15% test
    n_samples = total_days - temporal_window + 1
    train_end = int(0.7 * n_samples)
    val_end = int(0.85 * n_samples)
    
    os.makedirs(os.path.join(output_dir, 'train'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, 'val'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, 'test'), exist_ok=True)

    print(f"Generating {n_samples} samples...")
    for i in range(n_samples):
        # Extract window
        x = surface_data[i : i + temporal_window] # (T, C, H, W)
        m = mask_data[i : i + temporal_window]    # (T, 1, H, W)
        
        # Target is the subsurface temperature at the LAST day of the window
        y = subsurface_data[i + temporal_window - 1] # (D, H, W)
        
        # Determine split
        if i < train_end:
            split = 'train'
        elif i < val_end:
            split = 'val'
        else:
            split = 'test'
            
        # Save sample
        date_str = str(common_times[i + temporal_window - 1]).split('T')[0]
        filename = f"sample_{date_str}.npz"
        filepath = os.path.join(output_dir, split, filename)
        
        np.savez_compressed(
            filepath,
            surface=x,
            target=y,
            mask=m,
        )
        
    print(f"Split distribution:")
    print(f"  Train: {train_end} samples")
    print(f"  Val:   {val_end - train_end} samples")
    print(f"  Test:  {n_samples - val_end} samples")


def main():
    parser = argparse.ArgumentParser(description="Create training samples")
    parser.add_argument("--processed-dir", default="data/processed")
    parser.add_argument("--output-dir", default="data/samples")
    parser.add_argument("--window", type=int, default=7, help="Temporal window size in days")
    args = parser.parse_args()

    surface_path = os.path.join(args.processed_dir, "harmonized_surface.nc")
    subsurface_path = os.path.join(args.processed_dir, "harmonized_subsurface.nc")
    
    if not os.path.exists(surface_path) or not os.path.exists(subsurface_path):
        print("ERROR: Harmonized data not found. Run 'python scripts/preprocess.py' first.")
        sys.exit(1)
        
    print(f"Loading harmonized datasets...")
    surface_ds = xr.open_dataset(surface_path)
    subsurface_ds = xr.open_dataset(subsurface_path)
    
    create_split_samples(
        surface_ds,
        subsurface_ds,
        args.output_dir,
        temporal_window=args.window
    )
    
    print(f"\nSample generation complete. Files saved in {args.output_dir}")


if __name__ == "__main__":
    main()
