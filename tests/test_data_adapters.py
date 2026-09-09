import pytest
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import yaml
import os

from ml.data.adapters.mock import MockSurfaceAdapter
from ml.data.adapters.base import DatasetAdapter


# Helper to generate an in-memory dataset for testing
def create_test_dataset(coords_format='canonical', lon_convention='360'):
    lons = np.arange(-180, 180, 10) if lon_convention == '-180' else np.arange(0, 360, 10)
    lats = np.arange(90, -90, -10) # North to South initially to test sorting
    times = [datetime(2022, 1, 1) + timedelta(days=i) for i in range(5)]
    
    if coords_format == 'canonical':
        coord_dict = {'lon': lons, 'lat': lats, 'time': times}
    elif coords_format == 'cmems_glorys':
        coord_dict = {'longitude': lons, 'latitude': lats, 'time': times, 'depth': [0, 10]}
    else:
        coord_dict = {'nav_lon': lons, 'nav_lat': lats, 'time_counter': times}

    data = np.random.randn(len(times), len(lats), len(lons))
    
    # Add a NaN for testing QC
    data[0, 0, 0] = np.nan
    
    if coords_format == 'canonical':
        dims = ['time', 'lat', 'lon']
    elif coords_format == 'cmems_glorys':
        dims = ['time', 'latitude', 'longitude']
    else:
        dims = ['time_counter', 'nav_lat', 'nav_lon']

    data_vars = {'analysed_sst': (dims, data)}
    
    ds = xr.Dataset(data_vars=data_vars, coords=coord_dict)
    return ds


class DummyAdapter(DatasetAdapter):
    def __init__(self, name, config, ds):
        super().__init__(name, config)
        self._dataset = ds

    def load(self, path):
        pass
        
    def inspect(self):
        return {}
        
    def get_provenance(self):
        return {}


def test_coordinate_normalization():
    ds = create_test_dataset(coords_format='cmems_glorys', lon_convention='-180')
    
    # 1. Test mapping negative longitudes to 0-360
    config = {
        'coordinate_conventions': {
            'lon': ['longitude'],
            'lat': ['latitude'],
            'time': ['time'],
            'depth': ['depth']
        },
        'lon_convention': '360'
    }
    
    adapter = DummyAdapter('test', config, ds)
    ds_norm = adapter.normalize_coordinates()
    
    # Check names
    assert 'lon' in ds_norm.coords
    assert 'lat' in ds_norm.coords
    
    # Check lon 0-360
    assert float(ds_norm.lon.min()) >= 0
    assert float(ds_norm.lon.max()) <= 360
    
    # Check lat sorted South to North
    assert ds_norm.lat.values[0] < ds_norm.lat.values[-1]


def test_variable_mapping():
    ds = create_test_dataset(coords_format='canonical')
    
    config = {
        'variable_mapping': {
            'analysed_sst': 'sst'
        }
    }
    
    adapter = DummyAdapter('test', config, ds)
    ds_mapped = adapter.select_variables()
    
    assert 'sst' in ds_mapped.data_vars
    assert 'analysed_sst' not in ds_mapped.data_vars


def test_temporal_alignment():
    ds = create_test_dataset(coords_format='canonical')
    config = {}
    adapter = DummyAdapter('test', config, ds)
    
    # Test strict slicing
    start = "2022-01-02"
    end = "2022-01-03"
    
    ds_sub = adapter.dataset.sel(time=slice(start, end))
    assert len(ds_sub.time) == 2


def test_missing_value_preservation():
    ds = create_test_dataset(coords_format='canonical')
    config = {}
    adapter = DummyAdapter('test', config, ds)
    
    report = adapter.quality_control()
    stats = report.variables['analysed_sst']
    
    # Missing points should be > 0 and NOT silently filled
    assert stats['missing_points'] > 0
    assert np.isnan(adapter.dataset['analysed_sst'].values[0, 0, 0])
