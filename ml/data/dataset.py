"""
PyTorch Dataset for OceanEmbed training samples.

Loads pre-processed surface observation sequences and
subsurface temperature targets.
"""

import os
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
from torch.utils.data import Dataset


class OceanDataset(Dataset):
    """
    PyTorch Dataset for ocean temperature reconstruction.
    
    Each sample consists of:
    - surface: (T, C, H, W) — temporal window of surface observations
    - target: (D, H, W) — subsurface temperature at 15 depths
    - mask: (T, 1, H, W) — validity mask for surface observations
    - metadata: dict with date, location info
    """

    def __init__(
        self,
        samples_dir: str,
        split: str = "train",
        normalize: bool = True,
        norm_stats: Optional[Dict[str, np.ndarray]] = None,
        transform=None,
    ):
        """
        Args:
            samples_dir: Path to directory containing sample .npz files
            split: One of 'train', 'val', 'test'
            normalize: Whether to apply z-score normalization
            norm_stats: Dict with 'mean', 'std', 'target_mean', 'target_std'
                        If None and normalize=True, computes from data (train only)
            transform: Optional additional transforms
        """
        self.samples_dir = os.path.join(samples_dir, split)
        self.split = split
        self.normalize = normalize
        self.norm_stats = norm_stats
        self.transform = transform

        # Find all sample files
        self.sample_files = sorted([
            f for f in os.listdir(self.samples_dir)
            if f.endswith('.npz')
        ]) if os.path.exists(self.samples_dir) else []

        # Compute normalization statistics from training data if needed
        if normalize and norm_stats is None and split == "train" and len(self.sample_files) > 0:
            self.norm_stats = self._compute_norm_stats()

    def __len__(self) -> int:
        return len(self.sample_files)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        filepath = os.path.join(self.samples_dir, self.sample_files[idx])
        data = np.load(filepath, allow_pickle=True)

        surface = data['surface'].astype(np.float32)  # (T, C, H, W)
        target = data['target'].astype(np.float32)    # (D, H, W)
        mask = data['mask'].astype(np.float32)         # (T, 1, H, W)

        # Normalize
        if self.normalize and self.norm_stats is not None:
            mean = self.norm_stats['mean']   # (C,)
            std = self.norm_stats['std']     # (C,)
            # Reshape for broadcasting: (1, C, 1, 1)
            mean = mean.reshape(1, -1, 1, 1)
            std = std.reshape(1, -1, 1, 1)
            std = np.where(std < 1e-8, 1.0, std)  # avoid division by zero
            surface = (surface - mean) / std

            # Normalize target
            target_mean = self.norm_stats['target_mean']  # (D,)
            target_std = self.norm_stats['target_std']    # (D,)
            target_mean = target_mean.reshape(-1, 1, 1)
            target_std = target_std.reshape(-1, 1, 1)
            target_std = np.where(target_std < 1e-8, 1.0, target_std)
            target = (target - target_mean) / target_std

        # Handle NaNs — replace with 0 (masked regions)
        surface = np.nan_to_num(surface, nan=0.0)
        target = np.nan_to_num(target, nan=0.0)

        # Inject seasonal encodings (sin/cos of day of year)
        if 'date' in data:
            date_str = str(data['date'])
            try:
                from datetime import datetime
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                day_of_year = dt.timetuple().tm_yday
                sin_doy = np.sin(2 * np.pi * day_of_year / 365.25)
                cos_doy = np.cos(2 * np.pi * day_of_year / 365.25)
                
                T, C, H, W = surface.shape
                # Create channels filled with sin/cos values
                sin_channel = np.full((T, 1, H, W), sin_doy, dtype=np.float32)
                cos_channel = np.full((T, 1, H, W), cos_doy, dtype=np.float32)
                
                # Append to surface tensor -> shape becomes (T, C+2, H, W)
                surface = np.concatenate([surface, sin_channel, cos_channel], axis=1)
            except Exception as e:
                pass # If date parsing fails, we skip appending or let it fail?
                # Actually, better to pad with zeros if we want constant channel size
                # but if 'date' is missing, it will cause shape mismatch later.
        
        sample = {
            'surface': torch.from_numpy(surface),
            'target': torch.from_numpy(target),
            'mask': torch.from_numpy(mask),
        }

        if self.transform:
            sample = self.transform(sample)

        return sample

    def _compute_norm_stats(self) -> Dict[str, np.ndarray]:
        """Compute per-channel mean and std from training data."""
        print(f"Computing normalization statistics from {len(self.sample_files)} training samples...")
        
        all_surface = []
        all_target = []
        
        for f in self.sample_files:
            data = np.load(os.path.join(self.samples_dir, f), allow_pickle=True)
            all_surface.append(data['surface'])
            all_target.append(data['target'])

        surface = np.stack(all_surface)  # (N, T, C, H, W)
        target = np.stack(all_target)    # (N, D, H, W)

        # Per-channel statistics (over N, T, H, W)
        mean = np.nanmean(surface, axis=(0, 1, 3, 4))  # (C,)
        std = np.nanstd(surface, axis=(0, 1, 3, 4))    # (C,)

        target_mean = np.nanmean(target, axis=(0, 2, 3))  # (D,)
        target_std = np.nanstd(target, axis=(0, 2, 3))    # (D,)

        stats = {
            'mean': mean.astype(np.float32),
            'std': std.astype(np.float32),
            'target_mean': target_mean.astype(np.float32),
            'target_std': target_std.astype(np.float32),
        }

        print(f"  Surface mean: {mean}")
        print(f"  Surface std:  {std}")
        print(f"  Target mean:  {target_mean[:5]}...")
        print(f"  Target std:   {target_std[:5]}...")

        return stats

    def save_norm_stats(self, path: str):
        """Save normalization statistics to file."""
        if self.norm_stats is not None:
            np.savez(path, **self.norm_stats)

    @staticmethod
    def load_norm_stats(path: str) -> Dict[str, np.ndarray]:
        """Load normalization statistics from file."""
        data = np.load(path)
        return {k: data[k] for k in data.files}
