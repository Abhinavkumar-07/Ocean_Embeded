"""
Verification script for Real-Data Transition (Phase 8).
Ensures the canonical schema, temporal alignment, spatial alignment,
and physical properties of the dataset are correct before training.
"""

import os
import sys
import numpy as np
import xarray as xr

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.constants import NUM_DEPTHS, STANDARD_DEPTHS, NUM_INPUT_CHANNELS

CANONICAL_VARIABLES = ['sst', 'sss', 'ssh', 'u', 'v', 'wind_u', 'wind_v']
TARGET_VARIABLE = 'thetao'

def verify_physical_bounds(ds: xr.Dataset, var: str, min_val: float, max_val: float):
    """Sanity check for physical ranges and NaNs."""
    data = ds[var].values
    if np.all(np.isnan(data)):
        print(f"  [ERROR] {var} is entirely NaN!")
        return False
        
    valid_data = data[~np.isnan(data)]
    actual_min, actual_max = np.min(valid_data), np.max(valid_data)
    
    print(f"  [{var}] Range: {actual_min:.2f} to {actual_max:.2f}")
    if actual_min < min_val or actual_max > max_val:
        print(f"  [WARNING] {var} values out of expected physical bounds ({min_val} to {max_val})")
        return False
    return True

def check_alignment(surface_path: str, subsurface_path: str):
    """
    Validates the regridded and harmonized datasets.
    """
    print("=" * 60)
    print("DATA ALIGNMENT & SANITY CHECK")
    print("=" * 60)

    if not os.path.exists(surface_path):
        print(f"[BLOCKER] Surface dataset not found: {surface_path}")
        return False
    if not os.path.exists(subsurface_path):
        print(f"[BLOCKER] Subsurface dataset not found: {subsurface_path}")
        return False

    surf = xr.open_dataset(surface_path)
    sub = xr.open_dataset(subsurface_path)

    passed = True

    # 1. Variables
    print("\n1. Checking Variables...")
    missing_vars = [v for v in CANONICAL_VARIABLES if v not in surf.data_vars]
    if missing_vars:
        print(f"  [ERROR] Missing canonical variables in surface: {missing_vars}")
        passed = False
    else:
        print("  [OK] All canonical surface variables present.")

    if TARGET_VARIABLE not in sub.data_vars:
        print(f"  [ERROR] Missing canonical target in subsurface: {TARGET_VARIABLE}")
        passed = False
    else:
        print("  [OK] Canonical subsurface target present.")

    # 2. Spatial Grid (Must be exactly 0.25deg)
    print("\n2. Checking Spatial Grid Alignment...")
    surf_lon, surf_lat = surf['lon'].values, surf['lat'].values
    sub_lon, sub_lat = sub['lon'].values, sub['lat'].values
    
    if not np.array_equal(surf_lon, sub_lon) or not np.array_equal(surf_lat, sub_lat):
        print("  [ERROR] Spatial grids do NOT match exactly.")
        passed = False
    else:
        print("  [OK] Spatial grids perfectly aligned.")
        
    # Check 0.25 resolution
    if len(surf_lon) > 1 and not np.isclose(surf_lon[1] - surf_lon[0], 0.25):
        print(f"  [ERROR] Grid resolution is not 0.25 degrees (found {surf_lon[1] - surf_lon[0]})")
        passed = False

    # 3. Depth Grid (Must be exactly 15 canonical depths)
    print("\n3. Checking Depth Coordinates...")
    if 'depth' not in sub.coords:
        print("  [ERROR] 'depth' coordinate missing from subsurface dataset.")
        passed = False
    else:
        sub_depths = sub['depth'].values
        if len(sub_depths) != NUM_DEPTHS or not np.allclose(sub_depths, STANDARD_DEPTHS):
            print(f"  [ERROR] Depths do not match the 15 canonical depths.\nExpected: {STANDARD_DEPTHS}\nFound: {sub_depths}")
            passed = False
        else:
            print("  [OK] Target depths match the 15 canonical standard depths.")

    # 4. Temporal Alignment
    # Rule: Target timestamp T must correspond to the end of the temporal window ending at T.
    # We verify that they share exact timestamps post-interpolation.
    print("\n4. Checking Temporal Alignment...")
    surf_time = surf['time'].values
    sub_time = sub['time'].values
    
    if len(surf_time) != len(sub_time) or not np.array_equal(surf_time, sub_time):
        print("  [ERROR] Temporal alignment failed. Timestamps do not match exactly post-interpolation.")
        passed = False
    else:
        print(f"  [OK] {len(surf_time)} strictly aligned overlapping timesteps.")

    # 5. Physical Sanity Checks
    print("\n5. Physical Sanity Checks...")
    if 'sst' in surf.data_vars:
        passed = passed and verify_physical_bounds(surf, 'sst', -2.0, 40.0)
    if 'sss' in surf.data_vars:
        passed = passed and verify_physical_bounds(surf, 'sss', 0.0, 45.0)
    if 'thetao' in sub.data_vars:
        passed = passed and verify_physical_bounds(sub, 'thetao', -2.0, 40.0)

    print("\n" + "=" * 60)
    if passed:
        print("[SUCCESS] All data contract and alignment gates passed.")
    else:
        print("[FAILED] Data alignment gate failed. Do not proceed to training.")
    print("=" * 60)
    
    return passed

if __name__ == "__main__":
    surf_path = "data/processed/harmonized_surface.nc"
    sub_path = "data/processed/harmonized_subsurface.nc"
    success = check_alignment(surf_path, sub_path)
    sys.exit(0 if success else 1)
