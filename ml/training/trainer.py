"""
Training engine for OceanEmbed models.

Provides a reusable Trainer class for model training with:
- Configurable loss, optimizer, scheduler
- Early stopping
- Checkpointing
- Metric logging
"""

import os
import time
import json
from typing import Dict, Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader


class Trainer:
    """
    Training engine for OceanEmbed models.
    
    Usage:
        trainer = Trainer(model, criterion, optimizer, scheduler, config)
        trainer.fit(train_loader, val_loader)
    """

    def __init__(
        self,
        model: nn.Module,
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        scheduler: Optional[torch.optim.lr_scheduler.LRScheduler] = None,
        device: torch.device = torch.device('cpu'),
        config: Optional[dict] = None,
    ):
        self.model = model
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.config = config or {}

        self.best_val_loss = float('inf')
        self.patience_counter = 0
        self.metrics_log = []
        self.current_epoch = 0

    def train_epoch(self, dataloader) -> float:
        """Train for one epoch. Returns average loss."""
        self.model.train()
        total_loss = 0.0
        n_batches = 0

        for batch in dataloader:
            surface = batch['surface'].to(self.device)
            target = batch['target'].to(self.device)

            self.optimizer.zero_grad()
            pred = self.model(surface)
            loss = self.criterion(pred, target)
            loss.backward()

            # Gradient clipping
            grad_clip = self.config.get('gradient_clip', 1.0)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), grad_clip)

            self.optimizer.step()
            total_loss += loss.item()
            n_batches += 1

        return total_loss / max(n_batches, 1)

    @torch.no_grad()
    def validate(self, dataloader) -> float:
        """Validate. Returns average loss."""
        self.model.eval()
        total_loss = 0.0
        n_batches = 0

        for batch in dataloader:
            surface = batch['surface'].to(self.device)
            target = batch['target'].to(self.device)
            pred = self.model(surface)
            loss = self.criterion(pred, target)
            total_loss += loss.item()
            n_batches += 1

        return total_loss / max(n_batches, 1)

    def fit(
        self,
        train_loader,
        val_loader,
        epochs: int = 100,
        experiment_id: str = "default",
    ) -> Dict:
        """
        Full training loop with early stopping and checkpointing.
        
        Returns:
            Dict with training results and metrics.
        """
        patience = self.config.get('early_stopping', {}).get('patience', 15)
        checkpoint_dir = self.config.get('checkpoint', {}).get('save_dir', 'artifacts/checkpoints')
        log_interval = self.config.get('logging', {}).get('log_interval', 10)
        os.makedirs(checkpoint_dir, exist_ok=True)

        start_time = time.time()

        for epoch in range(1, epochs + 1):
            self.current_epoch = epoch
            train_loss = self.train_epoch(train_loader)
            val_loss = self.validate(val_loader)

            if self.scheduler:
                self.scheduler.step()

            lr = self.optimizer.param_groups[0]['lr']
            self.metrics_log.append({
                'epoch': epoch,
                'train_loss': train_loss,
                'val_loss': val_loss,
                'lr': lr,
            })

            # Log
            if epoch % log_interval == 0 or epoch <= 3:
                print(f"  Epoch {epoch:4d}/{epochs} | "
                      f"Train: {train_loss:.6f} | Val: {val_loss:.6f} | LR: {lr:.6f}")

            # Checkpoint best
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.patience_counter = 0
                self.save_checkpoint(
                    os.path.join(checkpoint_dir, 'best_model.pt'),
                    experiment_id=experiment_id,
                )
            else:
                self.patience_counter += 1

            # Save last
            self.save_checkpoint(
                os.path.join(checkpoint_dir, 'last_model.pt'),
                experiment_id=experiment_id,
            )

            # Early stopping
            if self.patience_counter >= patience:
                print(f"\n  Early stopping at epoch {epoch}")
                break

        duration = time.time() - start_time
        best_epoch = min(self.metrics_log, key=lambda x: x['val_loss'])['epoch']

        return {
            'experiment_id': experiment_id,
            'best_val_loss': self.best_val_loss,
            'best_epoch': best_epoch,
            'total_epochs': len(self.metrics_log),
            'training_duration_seconds': duration,
            'metrics_per_epoch': self.metrics_log,
        }

    def save_checkpoint(self, path: str, experiment_id: str = ""):
        """Save model checkpoint with full config for reproducibility."""
        torch.save({
            'epoch': self.current_epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_loss': self.best_val_loss,
            'config': self.config,
            'experiment_id': experiment_id,
        }, path)

    def load_checkpoint(self, path: str):
        """Load model from checkpoint."""
        checkpoint = torch.load(path, map_location=self.device, weights_only=False)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.current_epoch = checkpoint.get('epoch', 0)
        self.best_val_loss = checkpoint.get('val_loss', float('inf'))
        return checkpoint
