"""
Training script for OceanEmbed models.

Usage:
    python scripts/train.py --config configs/training.yaml
    python scripts/train.py --config configs/training.yaml --model baseline
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime

import numpy as np
import yaml

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.constants import NUM_DEPTHS, DEV_GRID_HEIGHT, DEV_GRID_WIDTH, NUM_INPUT_CHANNELS
from ml.models.baseline import BaselineCNN
from ml.models.oceanembed import OceanEmbedModel
from ml.losses.thermocline_loss import get_loss_function


def set_seed(seed: int):
    """Set random seed for reproducibility."""
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def get_device(config_device: str) -> torch.device:
    """Determine compute device."""
    if config_device == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(config_device)


def build_model(model_config: dict, device: torch.device) -> nn.Module:
    """Build model from config."""
    model_type = model_config.get('model_type', 'oceanembed')
    embed_dim = model_config.get('embedding', {}).get('dim', 128)
    in_channels = model_config.get('spatial_encoder', {}).get('in_channels', NUM_INPUT_CHANNELS)
    grid_h = model_config.get('grid', {}).get('height', DEV_GRID_HEIGHT)
    grid_w = model_config.get('grid', {}).get('width', DEV_GRID_WIDTH)
    dropout = model_config.get('spatial_encoder', {}).get('dropout', 0.1)

    if model_type == 'baseline':
        model = BaselineCNN(
            in_channels=in_channels,
            embed_dim=embed_dim,
            grid_height=grid_h,
            grid_width=grid_w,
            dropout=dropout,
        )
    else:
        temporal_window = model_config.get('temporal_window', 7)
        gru_layers = model_config.get('temporal_encoder', {}).get('num_layers', 2)
        depth_embed_dim = model_config.get('depth_decoder', {}).get('depth_embed_dim', 32)
        decoder_dropout = model_config.get('depth_decoder', {}).get('dropout', 0.2)

        model = OceanEmbedModel(
            in_channels=in_channels,
            embed_dim=embed_dim,
            temporal_window=temporal_window,
            gru_layers=gru_layers,
            depth_embed_dim=depth_embed_dim,
            grid_height=grid_h,
            grid_width=grid_w,
            dropout=dropout,
            decoder_dropout=decoder_dropout,
        )

    return model.to(device)


def train_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    num_batches = 0

    for batch in dataloader:
        surface = batch['surface'].to(device)
        target = batch['target'].to(device)
        
        if surface.dim() == 5 and getattr(model, 'temporal_window', None) is None:
            # Baseline model expects (B, C, H, W)
            surface = surface[:, -1, ...]

        optimizer.zero_grad()
        pred = model(surface)
        loss = criterion(pred, target)
        loss.backward()

        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)

        optimizer.step()
        total_loss += loss.item()
        num_batches += 1

    return total_loss / max(num_batches, 1)


def validate(model, dataloader, criterion, device):
    """Validate the model."""
    model.eval()
    total_loss = 0
    num_batches = 0

    with torch.no_grad():
        for batch in dataloader:
            surface = batch['surface'].to(device)
            target = batch['target'].to(device)
            
            if surface.dim() == 5 and getattr(model, 'temporal_window', None) is None:
                # Baseline model expects (B, C, H, W)
                surface = surface[:, -1, ...]
            pred = model(surface)
            loss = criterion(pred, target)
            total_loss += loss.item()
            num_batches += 1

    return total_loss / max(num_batches, 1)


def create_synthetic_dataloader(
    num_samples: int, temporal_window: int, in_channels: int,
    grid_h: int, grid_w: int, batch_size: int, is_temporal: bool = True
):
    """
    Create a DataLoader with synthetic data for pipeline testing.
    
    THIS IS FOR TESTING ONLY — clearly labeled synthetic data.
    """
    print(f"[WARNING] Creating synthetic dataset ({num_samples} samples) for pipeline validation")
    
    surfaces = []
    targets = []
    
    for i in range(num_samples):
        if is_temporal:
            # Create synthetic surface: (T, C, H, W)
            surface = torch.randn(temporal_window, in_channels, grid_h, grid_w)
        else:
            surface = torch.randn(in_channels, grid_h, grid_w)
        
        # Create synthetic target with physically-plausible structure
        # Temperature decreasing with depth (roughly)
        target = torch.zeros(NUM_DEPTHS, grid_h, grid_w)
        for d in range(NUM_DEPTHS):
            base_temp = 28.0 - d * 1.5  # Simple linear decrease
            target[d] = base_temp + torch.randn(grid_h, grid_w) * 0.5
        
        surfaces.append(surface)
        targets.append(target)
    
    dataset = torch.utils.data.TensorDataset(
        torch.stack(surfaces),
        torch.stack(targets),
    )
    
    return DataLoader(dataset, batch_size=batch_size, shuffle=True)


def main():
    parser = argparse.ArgumentParser(description="Train OceanEmbed model")
    parser.add_argument("--config", default="configs/training.yaml")
    parser.add_argument("--model-config", default="configs/model.yaml")
    parser.add_argument("--model", choices=["baseline", "oceanembed"], default=None,
                        help="Override model type")
    parser.add_argument("--synthetic", action="store_true",
                        help="Use synthetic data for pipeline testing")
    parser.add_argument("--epochs", type=int, default=None, help="Override epochs")
    args = parser.parse_args()

    # Load configs
    with open(args.config) as f:
        train_config = yaml.safe_load(f)
    with open(args.model_config) as f:
        model_config = yaml.safe_load(f)

    # Override from CLI
    if args.model:
        model_config['model_type'] = args.model
    epochs = args.epochs or train_config.get('epochs', 100)
    
    # Setup
    seed = train_config.get('seed', 42)
    set_seed(seed)
    device = get_device(train_config.get('device', 'auto'))
    print(f"Device: {device}")

    # Build model
    model = build_model(model_config, device)
    num_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Model: {model_config.get('model_type', 'oceanembed')} ({num_params:,} parameters)")

    # Loss
    criterion = get_loss_function(train_config.get('loss', {'type': 'mse'}))

    # Optimizer
    opt_config = train_config.get('optimizer', {})
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=opt_config.get('learning_rate', 0.001),
        weight_decay=opt_config.get('weight_decay', 0.01),
    )

    # Scheduler
    sched_config = train_config.get('scheduler', {})
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=sched_config.get('T_max', epochs),
        eta_min=sched_config.get('eta_min', 1e-5),
    )

    # Data
    batch_size = train_config.get('batch_size', 16)
    is_temporal = model_config.get('model_type', 'oceanembed') != 'baseline'
    grid_h = model_config.get('grid', {}).get('height', DEV_GRID_HEIGHT)
    grid_w = model_config.get('grid', {}).get('width', DEV_GRID_WIDTH)
    temporal_window = model_config.get('temporal_window', 7)
    in_channels = model_config.get('spatial_encoder', {}).get('in_channels', NUM_INPUT_CHANNELS)

    if args.synthetic:
        train_loader = create_synthetic_dataloader(
            64, temporal_window, in_channels, grid_h, grid_w, batch_size, is_temporal
        )
        val_loader = create_synthetic_dataloader(
            16, temporal_window, in_channels, grid_h, grid_w, batch_size, is_temporal
        )
    else:
        from ml.data.dataset import OceanDataset
        
        print(f"Loading datasets from data/samples...")
        train_dataset = OceanDataset(samples_dir="data/samples", split="train", normalize=True)
        # Get normalization stats from train to apply to val
        norm_stats = train_dataset.norm_stats
        # Save normalization stats for inference later
        train_dataset.save_norm_stats("artifacts/norm_stats.npz")
        
        val_dataset = OceanDataset(samples_dir="data/samples", split="val", normalize=True, norm_stats=norm_stats)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # We don't need the SyntheticWrapper when using OceanDataset
        class DatasetWrapper:
            def __init__(self, loader):
                self.loader = loader
            def __iter__(self):
                for batch in self.loader:
                    yield batch
            def __len__(self):
                return len(self.loader)
                
        train_loader = DatasetWrapper(train_loader)
        val_loader = DatasetWrapper(val_loader)

    if args.synthetic:
        # Wrap synthetic data in the expected format
        class SyntheticWrapper:
            def __init__(self, loader):
                self.loader = loader
            def __iter__(self):
                for surface, target in self.loader:
                    yield {'surface': surface, 'target': target}
            def __len__(self):
                return len(self.loader)

        train_loader = SyntheticWrapper(train_loader)
        val_loader = SyntheticWrapper(val_loader)

    # Training loop
    checkpoint_dir = train_config.get('checkpoint', {}).get('save_dir', 'artifacts/checkpoints')
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    best_val_loss = float('inf')
    patience_counter = 0
    patience = train_config.get('early_stopping', {}).get('patience', 15)
    
    experiment_id = f"exp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    metrics_log = []
    
    print(f"\n{'='*60}")
    print(f"Training: {experiment_id}")
    print(f"{'='*60}")
    
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss = validate(model, val_loader, criterion, device)
        scheduler.step()

        lr = optimizer.param_groups[0]['lr']
        
        metrics_log.append({
            'epoch': epoch,
            'train_loss': train_loss,
            'val_loss': val_loss,
            'lr': lr,
        })

        # Logging
        if epoch % train_config.get('logging', {}).get('log_interval', 10) == 0 or epoch <= 5:
            print(f"  Epoch {epoch:4d}/{epochs} | "
                  f"Train: {train_loss:.6f} | Val: {val_loss:.6f} | LR: {lr:.6f}")

        # Checkpointing
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss,
                'model_config': model_config,
                'train_config': train_config,
                'experiment_id': experiment_id,
            }, os.path.join(checkpoint_dir, 'best_model.pt'))
        else:
            patience_counter += 1

        # Save last model
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'val_loss': val_loss,
        }, os.path.join(checkpoint_dir, 'last_model.pt'))

        # Early stopping
        if patience_counter >= patience:
            print(f"\n  Early stopping at epoch {epoch} (patience={patience})")
            break

    duration = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Training complete in {duration:.1f}s")
    print(f"Best validation loss: {best_val_loss:.6f}")
    print(f"Checkpoint: {checkpoint_dir}/best_model.pt")
    print(f"{'='*60}")

    # Save metrics
    metrics_dir = train_config.get('logging', {}).get('metrics_dir', 'artifacts/metrics')
    os.makedirs(metrics_dir, exist_ok=True)
    
    results = {
        'experiment_id': experiment_id,
        'model_type': model_config.get('model_type', 'oceanembed'),
        'num_parameters': num_params,
        'best_val_loss': best_val_loss,
        'best_epoch': min(metrics_log, key=lambda x: x['val_loss'])['epoch'],
        'total_epochs': len(metrics_log),
        'training_duration_seconds': duration,
        'device': str(device),
        'seed': seed,
        'synthetic_data': args.synthetic,
        'metrics_per_epoch': metrics_log,
    }
    
    with open(os.path.join(metrics_dir, f'{experiment_id}.json'), 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Metrics saved to: {metrics_dir}/{experiment_id}.json")


if __name__ == "__main__":
    main()
