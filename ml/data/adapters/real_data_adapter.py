import xarray as xr
import numpy as np
import torch
from typing import Dict, Tuple

class RealDataAdapter:
    """
    Transforms raw CMEMS NetCDF files into the canonical mathematical tensors
    expected by OceanEmbedModel.
    """
    def __init__(self):
        # 0.25 deg increments
        self.canonical_lat = np.arange(5.0, 30.25, 0.25)
        self.canonical_lon = np.arange(45.0, 105.25, 0.25)
        
        self.canonical_depths = np.array([
            0, 5, 10, 20, 30, 50, 75, 100,
            125, 150, 200, 300, 500, 700, 1000
        ], dtype=np.float32)

        self.channels = [
            "sst", "sss", "ssh", "current_u", "current_v", "wind_u", "wind_v"
        ]

    def _interp_spatial(self, ds: xr.Dataset, method="linear") -> xr.Dataset:
        """Explicit spatial regridding to canonical grid."""
        return ds.interp(
            latitude=self.canonical_lat,
            longitude=self.canonical_lon,
            method=method,
            kwargs={"fill_value": np.nan} # Do not extrapolate across land mask
        )

    def load_and_canonicalize(self, paths: Dict[str, str]) -> Dict[str, xr.Dataset]:
        """Loads all raw datasets and canonicalizes their physics and grids."""
        canonical_data = {}
        
        # 1. SST
        ds_sst = xr.open_dataset(paths['sst'])
        ds_sst = ds_sst.rename({'analysed_sst': 'sst'})
        # K -> C
        ds_sst['sst'] = ds_sst['sst'] - 273.15
        canonical_data['sst'] = self._interp_spatial(ds_sst[['sst']])

        # 2. SSS
        ds_sss = xr.open_dataset(paths['sss'])
        ds_sss = ds_sss.rename({'sos': 'sss'})
        # explicit depth drop
        if 'depth' in ds_sss.dims:
            ds_sss = ds_sss.squeeze('depth').drop_vars('depth')
        canonical_data['sss'] = self._interp_spatial(ds_sss[['sss']])

        # 3. SSH
        ds_ssh = xr.open_dataset(paths['ssh'])
        ds_ssh = ds_ssh.rename({'adt': 'ssh'})
        canonical_data['ssh'] = self._interp_spatial(ds_ssh[['ssh']])

        # 4. ASCAT Winds
        ds_wind = xr.open_dataset(paths['wind'])
        ds_wind = ds_wind.rename({'eastward_wind': 'wind_u', 'northward_wind': 'wind_v'})
        # Hourly -> Daily aggregation
        ds_wind_daily = ds_wind.resample(time="1D").mean(skipna=False) # skipna=False to avoid hallucinating days
        canonical_data['wind'] = self._interp_spatial(ds_wind_daily[['wind_u', 'wind_v']])

        # 5. GlobCurrent
        ds_cur = xr.open_dataset(paths['current'])
        ds_cur = ds_cur.rename({'uo': 'current_u', 'vo': 'current_v'})
        # extract depth=0 explicitly
        ds_cur = ds_cur.isel(depth=0).drop_vars('depth')
        canonical_data['current'] = self._interp_spatial(ds_cur[['current_u', 'current_v']])

        # 6. GLORYS (Target)
        ds_glor = xr.open_dataset(paths['glorys'])
        ds_glor = self._interp_spatial(ds_glor[['thetao']])
        
        # GLORYS Depth Selection & Interpolation
        # 1D linear interpolation along depth axis to strictly required canonical levels
        # xarray.interp will use nearest bracketing neighbors.
        # We explicitly enforce no extrapolation.
        ds_glor = ds_glor.interp(
            depth=self.canonical_depths,
            method="linear",
            kwargs={"fill_value": np.nan}
        )
        canonical_data['glorys'] = ds_glor

        return canonical_data

    def create_sample(self, canonical_data: Dict[str, xr.Dataset], target_date: str) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, torch.Tensor]]:
        """
        Extracts a single leakage-free 7-day tensor sample.
        Input dates: t-6 to t
        Target date: t
        """
        import pandas as pd
        t_end = pd.to_datetime(target_date)
        t_start = t_end - pd.Timedelta(days=6)
        
        # Validate dates exist
        time_slice = slice(t_start, t_end)
        
        inputs = []
        masks = {}

        # 7 Channels
        var_to_ds = {
            "sst": ("sst", "sst"),
            "sss": ("sss", "sss"),
            "ssh": ("ssh", "ssh"),
            "current_u": ("current", "current_u"),
            "current_v": ("current", "current_v"),
            "wind_u": ("wind", "wind_u"),
            "wind_v": ("wind", "wind_v")
        }

        for ch in self.channels:
            ds_key, var_name = var_to_ds[ch]
            da = canonical_data[ds_key][var_name].sel(time=time_slice)
            
            # Assert exactly 7 days
            assert len(da.time) == 7, f"Leakage/missing data detected in {ch}: expected 7 days, got {len(da.time)}"
            
            val = da.values # shape (7, H, W)
            # Create independent mask (1 = valid, 0 = invalid)
            mask = (~np.isnan(val)).astype(np.float32)
            masks[f"{ch}_mask"] = torch.from_numpy(mask)
            
            # Fill NaNs with 0 strictly AFTER mask creation for tensor compatibility
            # Note: We do NOT natively convert NaN to 0 in the dataset, only in the output tensor.
            val_tensor = torch.from_numpy(np.nan_to_num(val, nan=0.0)).float()
            inputs.append(val_tensor)

        # X shape: (C=7, T=7, H, W) -> need to transpose to (T=7, C=7, H, W) based on mathematical contract
        X = torch.stack(inputs, dim=0) # (7, 7, H, W)
        X = X.transpose(0, 1) # (7, 7, H, W) -> (T=7, C=7, H, W)

        # Target (GLORYS) at exactly time t
        target_da = canonical_data['glorys']['thetao'].sel(time=t_end)
        val_target = target_da.values # shape (15, H, W)
        
        target_mask = (~np.isnan(val_target)).astype(np.float32)
        masks["target_mask"] = torch.from_numpy(target_mask)
        
        Y = torch.from_numpy(np.nan_to_num(val_target, nan=0.0)).float() # (15, H, W)

        # Explicit target leakage assertion
        assert t_end == pd.to_datetime(target_da.time.values), "Target time leakage detected"
        
        return X, Y, masks
