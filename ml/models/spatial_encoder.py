"""
CNN Spatial Encoder for OceanEmbed.

Processes a single timestep of surface observations (C × H × W)
and produces a latent embedding vector.
"""

import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    """Conv2d + BatchNorm + ReLU + optional MaxPool."""

    def __init__(self, in_ch: int, out_ch: int, kernel_size: int = 3,
                 padding: int = 1, pool: bool = False, dropout: float = 0.0):
        super().__init__()
        layers = [
            nn.Conv2d(in_ch, out_ch, kernel_size, padding=padding),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        ]
        if dropout > 0:
            layers.append(nn.Dropout2d(dropout))
        if pool:
            layers.append(nn.MaxPool2d(2))
        self.block = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class SpatialEncoder(nn.Module):
    """
    CNN-based spatial encoder.
    
    Input:  (B, C, H, W) — one timestep of surface observations
    Output: (B, embed_dim) — spatial embedding vector
    
    Architecture:
        Conv(C→32) → Conv(32→64, pool) → Conv(64→128, pool) → Conv(128→embed_dim)
        → AdaptiveAvgPool → Flatten
    """

    def __init__(
        self,
        in_channels: int = 7,
        channels: list = None,
        embed_dim: int = 128,
        dropout: float = 0.1,
    ):
        super().__init__()
        if channels is None:
            channels = [32, 64, 128]

        layers = []
        prev_ch = in_channels
        for i, ch in enumerate(channels):
            pool = i > 0  # pool after first layer
            layers.append(ConvBlock(prev_ch, ch, pool=pool, dropout=dropout))
            prev_ch = ch

        # Final conv to embed_dim
        layers.append(ConvBlock(prev_ch, embed_dim, dropout=dropout))

        self.encoder = nn.Sequential(*layers)
        self.pool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, C, H, W) surface observation maps
        Returns:
            (B, embed_dim) spatial embedding
        """
        features = self.encoder(x)  # (B, embed_dim, H', W')
        pooled = self.pool(features)  # (B, embed_dim, 1, 1)
        return pooled.flatten(1)  # (B, embed_dim)
