"""
Inference engine for OceanEmbed predictions.

Provides a clean interface for model inference that
doesn't require the frontend to know about PyTorch internals.
"""

import json
import os
from typing import Dict, List, Optional, Tuple

import numpy as np


def predict_temperature(
    surface_sequence: np.ndarray,
    model=None,
    norm_stats: Optional[Dict] = None,
    n_uncertainty_samples: int = 20,
) -> Dict:
    """
    High-level prediction interface.
    
    Args:
        surface_sequence: (T, C, H, W) surface observations
        model: trained PyTorch model
        norm_stats: normalization statistics
        n_uncertainty_samples: number of MC Dropout passes
    
    Returns:
        Dict with:
            temperature: (D, H, W) predicted temperatures
            uncertainty: (D, H, W) prediction uncertainty
            lower: (D, H, W) lower confidence bound
            upper: (D, H, W) upper confidence bound
            metadata: dict with model info
    """
    if model is None:
        raise ValueError("No model provided for inference")

    import torch

    device = next(model.parameters()).device
    
    # Normalize input
    x = surface_sequence.copy()
    if norm_stats is not None:
        mean = norm_stats['mean'].reshape(1, -1, 1, 1)
        std = norm_stats['std'].reshape(1, -1, 1, 1)
        std = np.where(std < 1e-8, 1.0, std)
        x = (x - mean) / std

    x = np.nan_to_num(x, nan=0.0)
    x_tensor = torch.from_numpy(x).float().unsqueeze(0).to(device)

    # MC Dropout prediction
    mean_pred, std_pred = model.predict_with_uncertainty(x_tensor, n_uncertainty_samples)
    
    mean_np = mean_pred.squeeze(0).cpu().numpy()
    std_np = std_pred.squeeze(0).cpu().numpy()

    # Denormalize if needed
    if norm_stats is not None and 'target_mean' in norm_stats:
        t_mean = norm_stats['target_mean'].reshape(-1, 1, 1)
        t_std = norm_stats['target_std'].reshape(-1, 1, 1)
        mean_np = mean_np * t_std + t_mean
        std_np = std_np * t_std

    return {
        'temperature': mean_np,
        'uncertainty': std_np,
        'lower': mean_np - 1.96 * std_np,
        'upper': mean_np + 1.96 * std_np,
        'metadata': {
            'n_uncertainty_samples': n_uncertainty_samples,
            'data_source': 'model_inference',
        },
    }


def load_demo_predictions(demo_dir: str = "data/samples/demo") -> Dict:
    """Load pre-computed demo predictions."""
    result = {}
    
    for filename in ['profiles.json', 'predictions.json', 'metrics.json', 'quality.json']:
        filepath = os.path.join(demo_dir, filename)
        if os.path.exists(filepath):
            with open(filepath) as f:
                key = filename.replace('.json', '')
                result[key] = json.load(f)
    
    return result
