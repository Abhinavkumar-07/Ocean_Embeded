import pytest
import torch
import xarray as xr
import numpy as np
import pandas as pd
from ml.data.adapters.real_data_adapter import RealDataAdapter
from ml.models.oceanembed import OceanEmbedModel
from ml.training.loss import ThermoclineWeightedLoss

@pytest.fixture
def data_paths():
    return {
        "sst": "data/raw/ostia_sst_subset.nc",
        "sss": "data/raw/sss_subset.nc",
        "ssh": "data/raw/ssh_subset.nc",
        "wind": "data/raw/ascat_subset.nc",
        "current": "data/raw/globcurrent_subset.nc",
        "glorys": "data/raw/glorys_subset.nc"
    }

def test_real_data_integration(data_paths):
    adapter = RealDataAdapter()
    
    # 1. Canonicalization
    canonical_data = adapter.load_and_canonicalize(data_paths)
    
    # Verify spatial canonical grid
    for name, ds in canonical_data.items():
        assert len(ds.latitude) == 101 # 5 to 30 = 25 / 0.25 = 100 + 1
        assert len(ds.longitude) == 241 # 45 to 105 = 60 / 0.25 = 240 + 1
        assert ds.latitude.values[0] == 5.0
        assert ds.longitude.values[0] == 45.0
        
    # Verify exact target depths
    np.testing.assert_array_equal(canonical_data['glorys'].depth.values, adapter.canonical_depths)
    
    # 2. Sample Extraction (target date: 2022-01-07 -> inputs: 2022-01-01 to 2022-01-07)
    target_date = "2022-01-07T00:00:00"
    X, Y, masks = adapter.create_sample(canonical_data, target_date)
    
    # Verify Shapes
    # X: (T=7, C=7, H=101, W=241)
    assert X.shape == (7, 7, 101, 241)
    # Y: (D=15, H=101, W=241)
    assert Y.shape == (15, 101, 241)
    
    # Independent Masks verification
    for ch in adapter.channels:
        m_name = f"{ch}_mask"
        assert m_name in masks
        assert masks[m_name].shape == (7, 101, 241) # (T, H, W)
        
    assert "target_mask" in masks
    assert masks["target_mask"].shape == (15, 101, 241)

    # 3. Physics Sanity Bounds (Bay of Bengal subset)
    # These bounds are plausible bounds for January 2022 subset. If these fail, units or regridding failed catastrophically.
    
    # SST
    sst = X[:, 0, :, :] # Channel 0
    sst_mask = masks["sst_mask"]
    sst_valid = sst[sst_mask == 1]
    assert sst_valid.min() > 15.0 and sst_valid.max() < 35.0, f"SST range invalid: {sst_valid.min()} to {sst_valid.max()}"
    
    # SSS
    sss = X[:, 1, :, :] # Channel 1
    sss_mask = masks["sss_mask"]
    sss_valid = sss[sss_mask == 1]
    assert sss_valid.min() > 25.0 and sss_valid.max() < 40.0, f"SSS range invalid: {sss_valid.min()} to {sss_valid.max()}"

    # Target (GLORYS) Temp
    y_valid = Y[masks["target_mask"] == 1]
    assert y_valid.min() > 0.0 and y_valid.max() < 35.0, f"Target Temp range invalid: {y_valid.min()} to {y_valid.max()}"

    # 4. Leakage Validation
    # X must not have NaN (filled with 0), Mask tracks the NaNs
    assert torch.isnan(X).sum() == 0
    assert torch.isnan(Y).sum() == 0
    
    # 5. Model Forward Pass Test
    # Batch dimension addition & duplication to B=2 (to avoid BatchNorm1d crash in train mode)
    X_batch = X.unsqueeze(0).repeat(2, 1, 1, 1, 1) # (B=2, T=7, C=7, H=101, W=241)
    Y_batch = Y.unsqueeze(0).repeat(2, 1, 1, 1) # (B=2, D=15, H=101, W=241)
    target_mask_batch = masks["target_mask"].unsqueeze(0).repeat(2, 1, 1, 1) # (B=2, D=15, H=101, W=241)

    model = OceanEmbedModel(
        in_channels=7,
        num_depths=15,
        temporal_window=7,
        grid_height=101,
        grid_width=241
    )
    
    model.train() # Enable gradients and batchnorm
    predictions = model(X_batch)
    
    assert predictions.shape == Y_batch.shape

    # 6. Loss Calculation
    criterion = ThermoclineWeightedLoss()
    loss = criterion(predictions, Y_batch, target_mask_batch)
    
    assert torch.isfinite(loss), "Loss must be finite"
    
    # 7. Gradient Sanity Check
    loss.backward()
    
    finite_grads = 0
    total_params = 0
    for name, param in model.named_parameters():
        if param.requires_grad:
            total_params += 1
            if param.grad is not None and torch.isfinite(param.grad).all():
                finite_grads += 1
            else:
                print(f"WARNING: Infinite/NaN gradient found in {name}")
                
    assert finite_grads == total_params, f"Only {finite_grads}/{total_params} parameters have finite gradients!"
    
    print("\n[SUCCESS] Pipeline executed successfully.")
    print(f"X shape: {X_batch.shape}")
    print(f"Y shape: {Y_batch.shape}")
    print(f"Loss: {loss.item():.4f} (Untrained-model pipeline sanity check only)")
    print(f"Gradients: {finite_grads}/{total_params} parameters have finite gradients")
    
if __name__ == "__main__":
    test_real_data_integration({
        "sst": "data/raw/sst_subset.nc",
        "sss": "data/raw/sss_subset.nc",
        "ssh": "data/raw/ssh_subset.nc",
        "wind": "data/raw/ascat_subset.nc",
        "current": "data/raw/globcurrent_subset.nc",
        "glorys": "data/raw/glorys_subset.nc"
    })
