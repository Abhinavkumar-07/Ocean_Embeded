import os
import xarray as xr
import numpy as np

CANONICAL_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000]

def inspect_dataset(file_path):
    print("=" * 60)
    print(f"DATASET INSPECTION: {os.path.basename(file_path)}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    # 10. File Size
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"File Size: {size_mb:.2f} MB")
    
    ds = xr.open_dataset(file_path)
    
    # 3. Native dimensions
    print(f"\nNative Dimensions: {ds.dims}")
    
    # 6. Variable Name
    vars_found = [v for v in ds.data_vars]
    print(f"Data Variables: {vars_found}")
    
    var_name = vars_found[0] if vars_found else None
    
    if var_name:
        # 5. Native Units
        units = ds[var_name].attrs.get('units', 'Unknown')
        print(f"Variable '{var_name}' Units: {units}")
        
        # 7. NaN/missing-value percentage
        data = ds[var_name].values
        nan_count = np.sum(np.isnan(data))
        total_count = data.size
        nan_percent = (nan_count / total_count) * 100
        print(f"NaN / Missing Values: {nan_count} / {total_count} ({nan_percent:.2f}%)")
    
    # 1 & 8. Coordinates & Spatial bounds
    if 'longitude' in ds.coords:
        lon = ds.coords['longitude'].values
        print(f"\nLongitude Range: {lon.min()} to {lon.max()} (Shape: {len(lon)})")
        print(f"Longitude Coordinate Convention: {lon.min()} to {lon.max()}")
    
    if 'latitude' in ds.coords:
        lat = ds.coords['latitude'].values
        print(f"Latitude Range: {lat.min()} to {lat.max()} (Shape: {len(lat)})")
    
    # 2. Time range
    if 'time' in ds.coords:
        time = ds.coords['time'].values
        print(f"Time Range: {time.min()} to {time.max()} (Shape: {len(time)})")
        
    # 4 & 11. Depth Coordinates and Canonical Mapping
    if 'depth' in ds.coords:
        depths = ds.coords['depth'].values
        print(f"\nNative Depth Levels ({len(depths)} total):")
        print(np.round(depths, 2))
        
        print("\nDepth Mapping to Canonical 15 Depths:")
        print("Canonical | Nearest Native | Abs Error")
        print("-" * 40)
        for cd in CANONICAL_DEPTHS:
            closest_idx = np.argmin(np.abs(depths - cd))
            closest_val = depths[closest_idx]
            error = np.abs(closest_val - cd)
            print(f"{cd:9} | {closest_val:14.2f} | {error:9.2f}")
    
    # 9. Provenance
    print(f"\nProvenance (Global Attributes):")
    for k, v in ds.attrs.items():
        if k in ['title', 'institution', 'source', 'history', 'references']:
            print(f"  {k}: {v}")
            
    print("=" * 60)

if __name__ == "__main__":
    inspect_dataset("data/raw/globcurrent_subset.nc")
