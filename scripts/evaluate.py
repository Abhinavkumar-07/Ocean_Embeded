"""
Evaluation script for OceanEmbed models.

Usage:
    python scripts/evaluate.py --checkpoint artifacts/checkpoints/best_model.pt
    python scripts/evaluate.py --checkpoint artifacts/checkpoints/best_model.pt --synthetic
"""

import argparse
import json
import os
import sys

import numpy as np
import yaml

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch

from ml.constants import STANDARD_DEPTHS, NUM_DEPTHS, DEV_GRID_HEIGHT, DEV_GRID_WIDTH
from ml.evaluation.metrics import (
    compute_all_metrics,
    physical_sanity_check,
)
from ml.models.baseline import BaselineCNN
from ml.models.oceanembed import OceanEmbedModel


def load_model(checkpoint_path: str, device: torch.device):
    """Load model from checkpoint."""
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model_config = checkpoint['model_config']
    model_type = model_config.get('model_type', 'oceanembed')

    embed_dim = model_config.get('embedding', {}).get('dim', 128)
    in_channels = model_config.get('spatial_encoder', {}).get('in_channels', 7)
    grid_h = model_config.get('grid', {}).get('height', DEV_GRID_HEIGHT)
    grid_w = model_config.get('grid', {}).get('width', DEV_GRID_WIDTH)

    if model_type == 'baseline':
        model = BaselineCNN(
            in_channels=in_channels, embed_dim=embed_dim,
            grid_height=grid_h, grid_width=grid_w,
        )
    else:
        model = OceanEmbedModel(
            in_channels=in_channels, embed_dim=embed_dim,
            grid_height=grid_h, grid_width=grid_w,
        )

    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()

    return model, model_config, checkpoint


def main():
    parser = argparse.ArgumentParser(description="Evaluate OceanEmbed model")
    parser.add_argument("--checkpoint", required=True, help="Path to model checkpoint")
    parser.add_argument("--synthetic", action="store_true", help="Use synthetic test data")
    parser.add_argument("--output", default="artifacts/metrics", help="Output directory")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load model
    model, model_config, checkpoint = load_model(args.checkpoint, device)
    model_type = model_config.get('model_type', 'oceanembed')
    print(f"Loaded model: {model_type} (epoch {checkpoint.get('epoch', '?')})")
    print(f"  Val loss at checkpoint: {checkpoint.get('val_loss', '?'):.6f}")

    grid_h = model_config.get('grid', {}).get('height', DEV_GRID_HEIGHT)
    grid_w = model_config.get('grid', {}).get('width', DEV_GRID_WIDTH)
    temporal_window = model_config.get('temporal_window', 7)
    in_channels = model_config.get('spatial_encoder', {}).get('in_channels', 7)

    # Generate or load test data
    if args.synthetic:
        print("[WARNING] Using synthetic test data — results are NOT scientific")
        n_test = 16
        is_temporal = model_type != 'baseline'

        all_preds = []
        all_targets = []

        with torch.no_grad():
            for _ in range(n_test):
                if is_temporal:
                    x = torch.randn(1, temporal_window, in_channels, grid_h, grid_w).to(device)
                else:
                    x = torch.randn(1, in_channels, grid_h, grid_w).to(device)

                target = torch.zeros(1, NUM_DEPTHS, grid_h, grid_w)
                for d in range(NUM_DEPTHS):
                    target[0, d] = 28.0 - d * 1.5 + torch.randn(grid_h, grid_w) * 0.5

                pred = model(x).cpu()
                all_preds.append(pred.numpy())
                all_targets.append(target.numpy())

        preds = np.concatenate(all_preds, axis=0)
        targets = np.concatenate(all_targets, axis=0)
    else:
        from ml.data.dataset import OceanDataset
        from torch.utils.data import DataLoader
        
        print("Loading test dataset from data/samples...")
        # Load norm stats computed during training
        norm_stats = OceanDataset.load_norm_stats("artifacts/norm_stats.npz")
        
        test_dataset = OceanDataset(samples_dir="data/samples", split="test", normalize=True, norm_stats=norm_stats)
        test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)
        
        is_temporal = model_type != 'baseline'
        all_preds = []
        all_targets = []
        
        with torch.no_grad():
            for batch in test_loader:
                surface = batch['surface'].to(device)
                target = batch['target'].numpy()
                
                # Baseline expects (B, C, H, W) without temporal dimension
                if not is_temporal and surface.dim() == 5:
                    surface = surface[:, -1, ...]
                    
                pred = model(surface).cpu().numpy()
                all_preds.append(pred)
                all_targets.append(target)
                
        preds = np.concatenate(all_preds, axis=0)
        targets = np.concatenate(all_targets, axis=0)

    # Compute metrics
    print("\nComputing metrics...")
    metrics = compute_all_metrics(preds, targets)
    
    # Physical sanity checks
    sanity = physical_sanity_check(preds)

    # Display results
    print(f"\n{'='*50}")
    print("EVALUATION RESULTS")
    print(f"{'='*50}")
    
    print(f"\nOverall:")
    for k, v in metrics['overall'].items():
        print(f"  {k:>15}: {v:.4f}")

    print(f"\nPer-Depth RMSE:")
    for depth_str, m in metrics['per_depth'].items():
        print(f"  {depth_str:>8}: RMSE={m['rmse']:.4f}  MAE={m['mae']:.4f}")

    print(f"\nDepth Bands:")
    for band, m in metrics['bands'].items():
        print(f"  {band:>12}: RMSE={m['rmse']:.4f}")

    print(f"\nPhysical Sanity:")
    for check, val in sanity.items():
        print(f"  {check:>35}: {val}")

    # Save results
    os.makedirs(args.output, exist_ok=True)
    exp_id = checkpoint.get('experiment_id', 'unknown')
    
    results = {
        'experiment_id': exp_id,
        'model_type': model_type,
        'checkpoint': args.checkpoint,
        'synthetic_data': args.synthetic,
        'metrics': metrics,
        'sanity_checks': {k: str(v) for k, v in sanity.items()},
    }
    
    output_path = os.path.join(args.output, f'eval_{exp_id}.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
