"""
Baseline CNN model for OceanEmbed.

Single-timestep model: CNN encoder → MLP decoder → 15-depth temperature.
Used as the baseline for ablation studies against the full temporal model.
"""

import torch
import torch.nn as nn

from ml.models.spatial_encoder import SpatialEncoder
from ml.constants import NUM_DEPTHS


class BaselineCNN(nn.Module):
    """
    Baseline model without temporal encoding.
    
    Input:  (B, C, H, W) — single timestep of surface observations
    Output: (B, D, H, W) — temperature at D depths
    """

    def __init__(
        self,
        in_channels: int = 7,
        embed_dim: int = 128,
        num_depths: int = NUM_DEPTHS,
        grid_height: int = 61,
        grid_width: int = 61,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.grid_height = grid_height
        self.grid_width = grid_width
        self.num_depths = num_depths

        # Spatial encoder
        self.encoder = SpatialEncoder(
            in_channels=in_channels,
            embed_dim=embed_dim,
            dropout=dropout,
        )

        # Simple MLP decoder (no depth embeddings)
        self.decoder = nn.Sequential(
            nn.Linear(embed_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, num_depths * grid_height * grid_width),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, C, H, W) surface observations (single timestep)
               or (B, T, C, H, W) — uses only the last timestep
        Returns:
            (B, D, H, W) temperature predictions
        """
        # Handle temporal input by taking last timestep
        if x.dim() == 5:
            x = x[:, -1]  # (B, C, H, W)

        embedding = self.encoder(x)  # (B, embed_dim)
        output = self.decoder(embedding)  # (B, D*H*W)
        return output.view(-1, self.num_depths, self.grid_height, self.grid_width)
