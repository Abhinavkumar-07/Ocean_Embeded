import os
import sys
import pytest
import torch
import numpy as np

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.models.oceanembed import OceanEmbedModel
from ml.losses.thermocline_loss import ThermoclineWeightedLoss
from ml.constants import NUM_DEPTHS, NUM_INPUT_CHANNELS, STANDARD_DEPTHS

@pytest.fixture
def sample_path():
    """Returns the path to a test sample if it exists, otherwise skips the test."""
    path = os.path.join("data", "samples", "train")
    if not os.path.exists(path):
        pytest.skip("Train samples directory does not exist. Run create_samples.py first.")
    
    files = [f for f in os.listdir(path) if f.endswith('.npz')]
    if not files:
        pytest.skip("No sample files found in train directory.")
        
    return os.path.join(path, files[0])

def test_real_data_forward_pass(sample_path):
    """
    Validates a single real sample passes through the model and loss function.
    """
    print(f"\n[TEST] Testing single sample: {sample_path}")
    
    # 1. Load Data
    data = np.load(sample_path, allow_pickle=True)
    assert 'surface' in data, "Sample missing 'surface' tensor"
    assert 'target' in data, "Sample missing 'target' tensor"
    assert 'mask' in data, "Sample missing 'mask' tensor"
    
    surface = torch.from_numpy(data['surface'].astype(np.float32)).unsqueeze(0) # (1, T, C, H, W)
    target = torch.from_numpy(data['target'].astype(np.float32)).unsqueeze(0)   # (1, D, H, W)
    mask = torch.from_numpy(data['mask'].astype(np.float32)).unsqueeze(0)       # (1, T, 1, H, W)
    
    # 2. Check Shapes
    B, T, C, H, W = surface.shape
    assert B == 1
    assert T == 7, f"Expected temporal window 7, got {T}"
    # Current preprocessing has 7 physical channels + 2 temporal (sin/cos of DOY) 
    # but the canonical requirement is just testing the shape is expected by the model.
    assert C >= 7, f"Expected at least 7 surface variables, got {C}"
    
    B_t, D, H_t, W_t = target.shape
    assert B_t == 1
    assert D == NUM_DEPTHS, f"Expected {NUM_DEPTHS} depths, got {D}"
    assert H == H_t and W == W_t, "Spatial dimensions of surface and target must match"
    
    print(f"  Input Shape: {surface.shape}")
    print(f"  Target Shape: {target.shape}")
    print(f"  Mask Shape: {mask.shape}")
    
    # 3. Model Forward Pass
    model = OceanEmbedModel(
        in_channels=C,
        embed_dim=64, # small for test
        grid_height=H,
        grid_width=W,
        temporal_window=T,
        encoder_type="cnn_gru"
    )
    model.eval()
    
    with torch.no_grad():
        pred = model(surface)
        
    assert pred.shape == target.shape, f"Prediction shape {pred.shape} does not match target {target.shape}"
    print(f"  Output Shape: {pred.shape}")
    
    # 4. Loss Calculation
    criterion = ThermoclineWeightedLoss()
    # Mask is temporal, we just use a basic MSE for the smoke test or slice the mask
    loss = criterion(pred, target)
    
    assert torch.isfinite(loss), f"Loss is not finite: {loss.item()}"
    print(f"  [SUCCESS] Forward pass and loss calculation successful. Loss = {loss.item():.4f}")

