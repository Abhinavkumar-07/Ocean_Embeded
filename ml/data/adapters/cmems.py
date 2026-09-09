"""
Real CMEMS dataset adapter.

Implements the DatasetAdapter interface for actual NetCDF files downloaded
from the Copernicus Marine Environment Monitoring Service (CMEMS).
"""

from datetime import datetime, timezone
import xarray as xr

from .base import DatasetAdapter


class CMEMSAdapter(DatasetAdapter):
    """Adapter for real CMEMS NetCDF datasets (GLORYS, OSTIA, etc)."""

    def __init__(self, name: str, config: dict, data_dir: str = "data/raw"):
        super().__init__(name, config, data_dir)
        self._provenance = {}

    def load(self, path: str) -> xr.Dataset:
        """Load the dataset and extract initial provenance metadata."""
        self._dataset = xr.open_dataset(path)
        
        # Extract initial provenance from global attributes
        attrs = self._dataset.attrs
        self._provenance = {
            "dataset_name": attrs.get("title", self.name),
            "provider": attrs.get("institution", "CMEMS"),
            "product_id": self.config.get("product_id", "unavailable"),
            "dataset_id": self.config.get("dataset_id", "unavailable"),
            "variable_names_original": list(self._dataset.data_vars.keys()),
            "source_url": attrs.get("source", "unavailable"),
            "download_timestamp": datetime.now(timezone.utc).isoformat(),
            "processing_version": attrs.get("history", "unavailable"),
            "coordinate_conventions": self.config.get("coordinate_conventions", "unavailable"),
            "depth_convention": self.config.get("depth_convention", "unavailable"),
            "lon_convention": self.config.get("lon_convention", "unavailable"),
            "status": "not verified against live source (needs live download)",
        }
        
        return self._dataset

    def inspect(self) -> dict:
        """Return metadata about the loaded dataset."""
        if self._dataset is None:
            return {}
        
        coords = self._dataset.coords
        
        # safely extract bounds
        def get_min_max(c_name):
            if c_name in coords:
                return float(coords[c_name].min()), float(coords[c_name].max())
            return None, None
            
        lon_min, lon_max = get_min_max('lon')
        lat_min, lat_max = get_min_max('lat')
        
        return {
            "name": self.name,
            "variables": list(self._dataset.data_vars.keys()),
            "spatial_domain": {
                "lon_min": lon_min, "lon_max": lon_max,
                "lat_min": lat_min, "lat_max": lat_max,
            },
            "time_range": [
                str(coords['time'].values[0]) if 'time' in coords else None,
                str(coords['time'].values[-1]) if 'time' in coords else None,
            ],
            "depth_levels": list(coords['depth'].values) if 'depth' in coords else [],
        }

    def get_provenance(self) -> dict:
        """Return the compiled provenance schema."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
            
        # Update with current state
        inspection = self.inspect()
        
        prov = self._provenance.copy()
        prov["variable_names_canonical"] = inspection["variables"]
        prov["spatial_extent"] = inspection["spatial_domain"]
        prov["temporal_extent"] = {
            "start": inspection["time_range"][0],
            "end": inspection["time_range"][1]
        }
        
        return prov

    def select_time(self, start_date: str, end_date: str) -> xr.Dataset:
        """Subset dataset by time range strictly (no leakage)."""
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
            
        if 'time' not in self._dataset.coords:
            return self._dataset
            
        ds = self._dataset.sel(time=slice(start_date, end_date))
        self._dataset = ds
        return ds
