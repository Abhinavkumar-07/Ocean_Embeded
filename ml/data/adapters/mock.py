"""
Mock dataset adapters for the synthetic data.

Implements the DatasetAdapter interface for the synthetic mock data generated
by the download_data.py script, acting as stand-ins for CMEMS data.
"""

from typing import List
import xarray as xr

from .base import DatasetAdapter


class MockSurfaceAdapter(DatasetAdapter):
    """Adapter for the synthetic surface observations."""

    def __init__(self, name: str, config: dict = None, data_dir: str = "data/raw"):
        super().__init__(name, config or {}, data_dir)

    def load(self, path: str) -> xr.Dataset:
        self._dataset = xr.open_dataset(path)
        return self._dataset

    def inspect(self) -> dict:
        if self._dataset is None:
            return {}
        return {
            "name": self.name,
            "variables": list(self._dataset.data_vars.keys()),
            "time_range": [
                str(self._dataset.time.values[0]),
                str(self._dataset.time.values[-1]),
            ],
            "spatial_domain": {
                "lon_min": float(self._dataset.lon.min()),
                "lon_max": float(self._dataset.lon.max()),
                "lat_min": float(self._dataset.lat.min()),
                "lat_max": float(self._dataset.lat.max()),
            },
        }

    def get_provenance(self) -> dict:
        return {
            "dataset_name": "Mock Surface Dataset",
            "provider": "OceanEmbed Demo",
            "status": "synthetic",
        }

    def select_variables(self) -> xr.Dataset:
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        return super().select_variables()


class MockSubsurfaceAdapter(DatasetAdapter):
    """Adapter for the synthetic target subsurface temperature."""

    def __init__(self, name: str, config: dict = None, data_dir: str = "data/raw"):
        super().__init__(name, config or {}, data_dir)

    def load(self, path: str) -> xr.Dataset:
        self._dataset = xr.open_dataset(path)
        return self._dataset

    def inspect(self) -> dict:
        if self._dataset is None:
            return {}
        return {
            "name": self.name,
            "variables": list(self._dataset.data_vars.keys()),
            "depth_levels": list(self._dataset.depth.values) if 'depth' in self._dataset.coords else [],
        }

    def get_provenance(self) -> dict:
        return {
            "dataset_name": "Mock Subsurface Dataset",
            "provider": "OceanEmbed Demo",
            "status": "synthetic",
        }

    def select_variables(self) -> xr.Dataset:
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
        return super().select_variables()
