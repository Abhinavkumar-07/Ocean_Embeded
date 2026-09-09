"""
Base dataset adapter interface.

All dataset adapters inherit from DatasetAdapter and implement
a common interface for loading, inspecting, and preprocessing
ocean observation datasets.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
import xarray as xr


@dataclass
class QualityReport:
    """Report from quality control checks on a dataset."""
    dataset_name: str
    variables: Dict[str, dict] = field(default_factory=dict)
    # Each variable has: missing_pct, min, max, fill_values, issues
    total_points: int = 0
    issues: List[str] = field(default_factory=list)

    def add_variable(self, name: str, data: np.ndarray):
        """Compute quality statistics for a variable."""
        valid = data[~np.isnan(data)] if isinstance(data, np.ndarray) else data
        total = data.size
        missing = np.isnan(data).sum() if isinstance(data, np.ndarray) else 0
        self.variables[name] = {
            'missing_pct': (missing / total * 100) if total > 0 else 0,
            'min': float(np.nanmin(data)) if len(valid) > 0 else None,
            'max': float(np.nanmax(data)) if len(valid) > 0 else None,
            'total_points': int(total),
            'missing_points': int(missing),
        }

    def summary(self) -> str:
        """Generate a text summary of the quality report."""
        lines = [f"Dataset Quality Report: {self.dataset_name}", ""]
        lines.append(f"{'Variable':<15} {'Missing %':>10} {'Min':>10} {'Max':>10}")
        lines.append("-" * 50)
        for name, stats in self.variables.items():
            missing = f"{stats['missing_pct']:.1f}%"
            vmin = f"{stats['min']:.2f}" if stats['min'] is not None else "N/A"
            vmax = f"{stats['max']:.2f}" if stats['max'] is not None else "N/A"
            lines.append(f"{name:<15} {missing:>10} {vmin:>10} {vmax:>10}")
        if self.issues:
            lines.append("")
            lines.append("Issues:")
            for issue in self.issues:
                lines.append(f"  - {issue}")
        return "\n".join(lines)


class DatasetAdapter(ABC):
    """
    Abstract base class for ocean dataset adapters.
    
    Every dataset (SST, SSS, SSH, currents, wind, GLORYS, Argo)
    implements this interface for consistent data handling.
    """

    def __init__(self, name: str, config: dict, data_dir: str = "data/raw"):
        self.name = name
        self.config = config
        self.data_dir = data_dir
        self._dataset: Optional[xr.Dataset] = None

    @abstractmethod
    def load(self, path: str) -> xr.Dataset:
        """Load the dataset from file."""
        pass

    @abstractmethod
    def inspect(self) -> dict:
        """Return metadata about the loaded dataset."""
        pass

    @abstractmethod
    def get_provenance(self) -> dict:
        """Return the dataset provenance matching the Canonical Provenance Schema."""
        pass

    def select_variables(self) -> xr.Dataset:
        """Select specific variables from the dataset based on config."""
        ds = self._dataset
        if ds is None:
            raise ValueError("No dataset loaded.")
        
        mapping = self.config.get('variable_mapping', {})
        if not mapping:
            return ds

        vars_to_keep = list(mapping.keys())
        ds = ds[vars_to_keep]
        # Rename to canonical names
        ds = ds.rename(mapping)
        self._dataset = ds
        return ds

    def normalize_coordinates(self) -> xr.Dataset:
        """
        Normalize coordinate names and conventions based on config mapping:
        - Rename to canonical: lon, lat, time, depth
        - Latitude: South → North ordering
        - Longitude: Configurable convention ('360' or '-180')
        - Time: datetime64[ns]
        """
        ds = self._dataset
        if ds is None:
            raise ValueError("No dataset loaded. Call load() first.")

        # 1. Rename coordinates based on config
        coord_map = self.config.get('coordinate_conventions', {})
        rename_map = {}
        for canonical, source_list in coord_map.items():
            for source in source_list:
                if source in ds.coords:
                    rename_map[source] = canonical
                    break
        
        # If no config provided, fallback to heuristic (mainly for mock compatibility)
        if not rename_map:
            for coord in ds.coords:
                lower = str(coord).lower()
                if lower in ('longitude', 'x', 'nav_lon'): rename_map[coord] = 'lon'
                elif lower in ('latitude', 'y', 'nav_lat'): rename_map[coord] = 'lat'
                elif lower in ('time_counter', 'time'): rename_map[coord] = 'time'
                elif lower in ('depth', 'pres', 'z'): rename_map[coord] = 'depth'

        if rename_map:
            ds = ds.rename(rename_map)

        # 2. Ensure latitude is south → north
        if 'lat' in ds.coords and ds.lat.values[0] > ds.lat.values[-1]:
            ds = ds.sortby('lat')
            
        # Ensure depth is shallow → deep
        if 'depth' in ds.coords and ds.depth.values[0] > ds.depth.values[-1]:
            ds = ds.sortby('depth')

        # 3. Normalize longitude convention
        lon_convention = self.config.get('lon_convention', '360')
        if 'lon' in ds.coords:
            if lon_convention == '360':
                # Force to 0..360
                lon_vals = ds.lon.values
                if np.any(lon_vals < 0):
                    ds = ds.assign_coords(lon=(ds.lon % 360))
                    ds = ds.sortby('lon')
            elif lon_convention == '-180':
                # Force to -180..180
                lon_vals = ds.lon.values
                if np.any(lon_vals > 180):
                    ds = ds.assign_coords(lon=(((ds.lon + 180) % 360) - 180))
                    ds = ds.sortby('lon')

        self._dataset = ds
        return ds

    def subset_region(
        self,
        lon_min: float, lon_max: float,
        lat_min: float, lat_max: float,
    ) -> xr.Dataset:
        """Subset to a geographic region."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        ds = self._dataset.sel(
            lon=slice(lon_min, lon_max),
            lat=slice(lat_min, lat_max),
        )
        self._dataset = ds
        return ds

    def regrid(self, target_lons: np.ndarray, target_lats: np.ndarray) -> xr.Dataset:
        """
        Regrid to target resolution using linear interpolation.
        """
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        ds = self._dataset.interp(
            lon=target_lons,
            lat=target_lats,
            method='linear',
        )
        self._dataset = ds
        return ds

    def resample_time(self, freq: str = '1D') -> xr.Dataset:
        """Resample to target temporal frequency."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        ds = self._dataset.resample(time=freq).mean()
        self._dataset = ds
        return ds

    def quality_control(self) -> QualityReport:
        """Run quality control checks and return a report."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        report = QualityReport(dataset_name=self.name)
        for var_name in self._dataset.data_vars:
            data = self._dataset[var_name].values
            report.add_variable(var_name, data)
        return report

    def export(self, path: str) -> None:
        """Export the processed dataset to NetCDF."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        self._dataset.to_netcdf(path)

    @property
    def dataset(self) -> Optional[xr.Dataset]:
        return self._dataset
