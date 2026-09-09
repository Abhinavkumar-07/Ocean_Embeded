"""
Real Argo dataset adapter.

Implements the DatasetAdapter interface for Argo profile data.
"""

from datetime import datetime, timezone
import xarray as xr

from .base import DatasetAdapter


class ArgoAdapter(DatasetAdapter):
    """Adapter for real Argo NetCDF datasets."""

    def __init__(self, name: str, config: dict, data_dir: str = "data/raw"):
        super().__init__(name, config, data_dir)
        self._provenance = {}

    def load(self, path: str) -> xr.Dataset:
        """Load the Argo dataset and extract provenance."""
        self._dataset = xr.open_dataset(path)
        
        attrs = self._dataset.attrs
        self._provenance = {
            "dataset_name": attrs.get("title", self.name),
            "provider": attrs.get("institution", "ARGO"),
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
        if self._dataset is None:
            return {}
        
        # Argo datasets often use N_PROF for profiles, TIME for time
        coords = self._dataset.coords
        
        def get_min_max(c_name):
            if c_name in coords:
                return float(coords[c_name].min()), float(coords[c_name].max())
            return None, None
            
        lon_min, lon_max = get_min_max('LONGITUDE')
        if lon_min is None:
            lon_min, lon_max = get_min_max('lon')
            
        lat_min, lat_max = get_min_max('LATITUDE')
        if lat_min is None:
            lat_min, lat_max = get_min_max('lat')
            
        return {
            "name": self.name,
            "variables": list(self._dataset.data_vars.keys()),
            "spatial_domain": {
                "lon_min": lon_min, "lon_max": lon_max,
                "lat_min": lat_min, "lat_max": lat_max,
            },
            "time_range": [
                str(coords['TIME'].values[0]) if 'TIME' in coords else None,
                str(coords['TIME'].values[-1]) if 'TIME' in coords else None,
            ],
            "profiles_count": len(coords.get('N_PROF', []))
        }

    def get_provenance(self) -> dict:
        if self._dataset is None:
            raise ValueError("No dataset loaded.")
            
        inspection = self.inspect()
        prov = self._provenance.copy()
        prov["variable_names_canonical"] = inspection["variables"]
        prov["spatial_extent"] = inspection["spatial_domain"]
        prov["temporal_extent"] = {
            "start": inspection["time_range"][0],
            "end": inspection["time_range"][1]
        }
        return prov
