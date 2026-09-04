"""
Spatial and temporal harmonization for ocean datasets.

Regrids all datasets to a common 0.25° × 0.25° grid
and aligns temporal resolution to daily.
"""

import numpy as np
import xarray as xr
from typing import Optional, Tuple

from ml.constants import DOMAIN, DEV_DOMAIN


def create_target_grid(
    domain: dict = None,
    resolution: float = 0.25,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Create the target grid coordinates.
    
    Returns:
        (lons, lats) arrays at target resolution.
    """
    if domain is None:
        domain = DEV_DOMAIN
    
    lons = np.arange(domain['lon_min'], domain['lon_max'] + resolution / 2, resolution)
    lats = np.arange(domain['lat_min'], domain['lat_max'] + resolution / 2, resolution)
    
    return lons, lats


def regrid_dataset(
    ds: xr.Dataset,
    target_lons: np.ndarray,
    target_lats: np.ndarray,
    method: str = 'linear',
) -> xr.Dataset:
    """
    Regrid a dataset to the target grid.
    
    Uses xarray's built-in interpolation (backed by scipy).
    
    Args:
        ds: source dataset with 'lon' and 'lat' coordinates
        target_lons: target longitude values
        target_lats: target latitude values
        method: interpolation method ('linear', 'nearest')
    """
    # Ensure coordinates are named correctly
    coord_map = {}
    for coord in ds.coords:
        lower = coord.lower()
        if lower in ('longitude', 'x', 'nav_lon') and coord != 'lon':
            coord_map[coord] = 'lon'
        elif lower in ('latitude', 'y', 'nav_lat') and coord != 'lat':
            coord_map[coord] = 'lat'
    
    if coord_map:
        ds = ds.rename(coord_map)
    
    # Sort coordinates
    if 'lat' in ds.coords:
        ds = ds.sortby('lat')
    if 'lon' in ds.coords:
        ds = ds.sortby('lon')
    
    # Regrid
    ds_regridded = ds.interp(
        lon=target_lons,
        lat=target_lats,
        method=method,
    )
    
    return ds_regridded


def align_temporal(
    ds: xr.Dataset,
    freq: str = '1D',
    method: str = 'mean',
) -> xr.Dataset:
    """
    Align temporal resolution.
    
    Args:
        ds: dataset with 'time' coordinate
        freq: target frequency ('1D' for daily)
        method: aggregation method ('mean', 'nearest')
    """
    if 'time' not in ds.coords:
        return ds
    
    if method == 'mean':
        return ds.resample(time=freq).mean()
    elif method == 'nearest':
        return ds.resample(time=freq).nearest()
    else:
        raise ValueError(f"Unknown method: {method}")


def normalize_longitude(ds: xr.Dataset, convention: str = '0_360') -> xr.Dataset:
    """
    Normalize longitude convention.
    
    Args:
        convention: '0_360' for [0, 360] or '-180_180' for [-180, 180]
    """
    if 'lon' not in ds.coords:
        return ds
    
    lon = ds.lon.values
    
    if convention == '0_360':
        lon = np.where(lon < 0, lon + 360, lon)
    elif convention == '-180_180':
        lon = np.where(lon > 180, lon - 360, lon)
    
    ds = ds.assign_coords(lon=lon)
    ds = ds.sortby('lon')
    return ds


def harmonize_dataset(
    ds: xr.Dataset,
    domain: dict = None,
    resolution: float = 0.25,
) -> xr.Dataset:
    """
    Full harmonization pipeline for a single dataset.
    
    1. Normalize longitude
    2. Sort latitude (south→north)
    3. Subset to domain
    4. Regrid to target resolution
    5. Daily temporal alignment
    """
    if domain is None:
        domain = DEV_DOMAIN
    
    # Normalize longitude
    ds = normalize_longitude(ds, '0_360')
    
    # Sort latitude
    if 'lat' in ds.coords and ds.lat.values[0] > ds.lat.values[-1]:
        ds = ds.sortby('lat')
    
    # Subset region
    ds = ds.sel(
        lon=slice(domain['lon_min'], domain['lon_max']),
        lat=slice(domain['lat_min'], domain['lat_max']),
    )
    
    # Regrid
    target_lons, target_lats = create_target_grid(domain, resolution)
    ds = regrid_dataset(ds, target_lons, target_lats)
    
    # Temporal alignment
    ds = align_temporal(ds, freq='1D')
    
    return ds
