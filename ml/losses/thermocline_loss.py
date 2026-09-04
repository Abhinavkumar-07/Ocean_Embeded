"""
Loss functions for OceanEmbed.

Includes standard losses and thermocline-aware depth-weighted loss.
"""

import torch
import torch.nn as nn
from typing import Optional, List

from ml.constants import SURFACE_INDICES, THERMOCLINE_INDICES, DEEP_INDICES


class ThermoclineWeightedLoss(nn.Module):
    """
    Depth-weighted loss that emphasizes thermocline reconstruction.
    
    L = L_surface + λ_thermo * L_thermocline + λ_deep * L_deep
    
    Depth bands:
        Surface:     0–50m   (indices 0-5)
        Thermocline: 75–300m (indices 6-11)
        Deep:        500–1000m (indices 12-14)
    """

    def __init__(
        self,
        base_loss: str = "mse",
        surface_weight: float = 1.0,
        thermocline_weight: float = 2.0,
        deep_weight: float = 1.0,
        surface_indices: Optional[List[int]] = None,
        thermocline_indices: Optional[List[int]] = None,
        deep_indices: Optional[List[int]] = None,
    ):
        super().__init__()

        if base_loss == "mse":
            self.criterion = nn.MSELoss(reduction='mean')
        elif base_loss == "mae":
            self.criterion = nn.L1Loss(reduction='mean')
        elif base_loss == "huber":
            self.criterion = nn.SmoothL1Loss(reduction='mean')
        else:
            raise ValueError(f"Unknown base loss: {base_loss}")

        self.surface_weight = surface_weight
        self.thermocline_weight = thermocline_weight
        self.deep_weight = deep_weight

        self.surface_idx = surface_indices or SURFACE_INDICES
        self.thermocline_idx = thermocline_indices or THERMOCLINE_INDICES
        self.deep_idx = deep_indices or DEEP_INDICES

    def forward(
        self,
        pred: torch.Tensor,
        target: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Args:
            pred: (B, D, H, W) predicted temperatures
            target: (B, D, H, W) target temperatures
            mask: optional (B, D, H, W) validity mask
        Returns:
            Weighted loss scalar
        """
        if mask is not None:
            pred = pred * mask
            target = target * mask

        # Surface loss
        loss_surface = self.criterion(
            pred[:, self.surface_idx],
            target[:, self.surface_idx],
        )

        # Thermocline loss
        loss_thermo = self.criterion(
            pred[:, self.thermocline_idx],
            target[:, self.thermocline_idx],
        )

        # Deep loss
        loss_deep = self.criterion(
            pred[:, self.deep_idx],
            target[:, self.deep_idx],
        )

        # Weighted total
        total = (
            self.surface_weight * loss_surface
            + self.thermocline_weight * loss_thermo
            + self.deep_weight * loss_deep
        )

        return total

    def compute_band_losses(
        self, pred: torch.Tensor, target: torch.Tensor
    ) -> dict:
        """Compute individual band losses for logging."""
        with torch.no_grad():
            mse = nn.MSELoss(reduction='mean')
            return {
                'surface_loss': mse(pred[:, self.surface_idx], target[:, self.surface_idx]).item(),
                'thermocline_loss': mse(pred[:, self.thermocline_idx], target[:, self.thermocline_idx]).item(),
                'deep_loss': mse(pred[:, self.deep_idx], target[:, self.deep_idx]).item(),
            }


def get_loss_function(config: dict) -> nn.Module:
    """Factory function to create loss from config."""
    loss_type = config.get('type', 'mse')

    if loss_type == 'mse':
        return nn.MSELoss()
    elif loss_type == 'mae':
        return nn.L1Loss()
    elif loss_type == 'huber':
        return nn.SmoothL1Loss()
    elif loss_type == 'thermocline_weighted':
        return ThermoclineWeightedLoss(
            base_loss=config.get('base_loss', 'mse'),
            surface_weight=config.get('surface_weight', 1.0),
            thermocline_weight=config.get('thermocline_weight', 2.0),
            deep_weight=config.get('deep_weight', 1.0),
        )
    else:
        raise ValueError(f"Unknown loss type: {loss_type}")
