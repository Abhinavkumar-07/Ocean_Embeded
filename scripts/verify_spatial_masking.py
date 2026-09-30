import xarray as xr
import numpy as np

def verify_mask_preservation():
    print("Verifying Mask Semantics across Spatial Interpolation...")
    
    # Use the existing smoke-test subset downloaded in Phase 8
    sst_path = "data/raw/ostia_sst_subset.nc"
    try:
        ds_native = xr.open_dataset(sst_path)
    except FileNotFoundError:
        print("Required test file missing. Please ensure ostia_sst_subset.nc exists.")
        return
        
    sst_native = ds_native['analysed_sst'].isel(time=0)
    
    native_total = sst_native.size
    native_valid = int(sst_native.count().values)
    native_nans = native_total - native_valid
    native_valid_frac = native_valid / native_total
    
    print(f"\n[NATIVE 0.05deg GRID]")
    print(f"Total Pixels: {native_total}")
    print(f"Valid Ocean Pixels: {native_valid} ({native_valid_frac:.2%})")
    print(f"NaN / Land Pixels: {native_nans}")
    
    # Canonical Grid Definition (Matched to the Bay of Bengal subset bounds)
    canonical_lat = np.arange(10.0, 20.0 + 0.25, 0.25)
    canonical_lon = np.arange(80.0, 95.0 + 0.25, 0.25)
    
    # Interpolate
    print("\nExecuting xarray.interp(method='linear') onto Canonical 0.25deg Grid...")
    
    # We must rename coordinates if they differ
    if 'lat' in ds_native.coords:
        sst_native = sst_native.rename({'lat': 'latitude', 'lon': 'longitude'})
        
    ds_canonical = sst_native.interp(
        latitude=canonical_lat, 
        longitude=canonical_lon, 
        method="linear"
    )
    
    canonical_total = ds_canonical.size
    canonical_valid = int(ds_canonical.count().values)
    canonical_nans = canonical_total - canonical_valid
    canonical_valid_frac = canonical_valid / canonical_total
    
    print(f"\n[CANONICAL 0.25deg GRID]")
    print(f"Total Pixels: {canonical_total}")
    print(f"Valid Ocean Pixels: {canonical_valid} ({canonical_valid_frac:.2%})")
    print(f"NaN / Land Pixels: {canonical_nans}")
    
    # Verify no artificial creation across coasts
    # The valid fraction should remain roughly identical (allowing for minor coastal discretization changes)
    diff = abs(native_valid_frac - canonical_valid_frac)
    print(f"\nFractional Coverage Shift: {diff:.4%}")
    
    if diff > 0.05: # If more than 5% of the land suddenly became ocean
        print("[FAIL] Interpolation significantly distorted the land/ocean mask boundaries!")
    else:
        print("[PASS] Native NaN masking semantics successfully preserved across regridding boundary.")
        
if __name__ == "__main__":
    verify_mask_preservation()
