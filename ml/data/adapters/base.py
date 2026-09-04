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

    def __init__(self, name: str, data_dir: str = "data/raw"):
        self.name = name
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
    def select_variables(self, variables: List[str]) -> xr.Dataset:
        """Select specific variables from the dataset."""
        pass

    def normalize_coordinates(self) -> xr.Dataset:
        """
        Normalize coordinate names and conventions:
        - Rename to: lon, lat, time, depth
        - Longitude: 0–360° convention
        - Latitude: South → North ordering
        - Time: datetime64[ns]
        """
        ds = self._dataset
        if ds is None:
            raise ValueError("No dataset loaded. Call load() first.")

        # Rename common coordinate variations
        rename_map = {}
        for coord in ds.coords:
            lower = coord.lower()
            if lower in ('longitude', 'x', 'nav_lon'):
                rename_map[coord] = 'lon'
            elif lower in ('latitude', 'y', 'nav_lat'):
                rename_map[coord] = 'lat'
            elif lower in ('time_counter',):
                rename_map[coord] = 'time'

        if rename_map:
            ds = ds.rename(rename_map)

        # Ensure latitude is south → north
        if 'lat' in ds.coords and ds.lat.values[0] > ds.lat.values[-1]:
            ds = ds.sortby('lat')

        # Normalize longitude to 0–360 if needed
        if 'lon' in ds.coords:
            lon_vals = ds.lon.values
            if np.any(lon_vals < 0):
                ds = ds.assign_coords(lon=(ds.lon % 360))
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
