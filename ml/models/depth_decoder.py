"""
Depth-Aware Decoder for OceanEmbed.

Uses learned depth embeddings combined with the ocean representation
to predict temperature at each standard depth level.
"""

import torch
import torch.nn as nn
import numpy as np

from ml.constants import STANDARD_DEPTHS, NUM_DEPTHS


class DepthAwareDecoder(nn.Module):
    """
    Depth-aware temperature decoder with learned depth embeddings.
    
    Input:  (B, embed_dim) — ocean embedding
    Output: (B, D, H, W) — temperature at D depth levels
    
    For each depth:
        concat(ocean_embedding, depth_embedding) → MLP → temperature map
    """

    def __init__(
        self,
        embed_dim: int = 128,
        num_depths: int = NUM_DEPTHS,
        depth_embed_dim: int = 32,
        hidden_dims: list = None,
        grid_height: int = 61,
        grid_width: int = 61,
        dropout: float = 0.2,
    ):
        super().__init__()
        if hidden_dims is None:
            hidden_dims = [256, 128]

        self.num_depths = num_depths
        self.grid_height = grid_height
        self.grid_width = grid_width

        # Learned depth embeddings
        self.depth_embedding = nn.Embedding(num_depths, depth_embed_dim)

        # Initialize with normalized depth values for physically meaningful init
        with torch.no_grad():
            depths_normalized = torch.tensor(STANDARD_DEPTHS[:num_depths]) / 1000.0
            # Simple initialization — will be learned
            self.depth_embedding.weight[:, 0] = depths_normalized

        # MLP decoder
        input_dim = embed_dim + depth_embed_dim
        layers = []
        prev_dim = input_dim
        for hdim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hdim),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
            ])
            prev_dim = hdim
        
        # Output: one temperature value per grid cell
        layers.append(nn.Linear(prev_dim, grid_height * grid_width))

        self.mlp = nn.Sequential(*layers)

    def forward(self, ocean_embedding: torch.Tensor) -> torch.Tensor:
        """
        Args:
            ocean_embedding: (B, embed_dim) ocean latent representation
        Returns:
            (B, D, H, W) temperature predictions at each depth
        """
        B = ocean_embedding.shape[0]
        outputs = []

        for d in range(self.num_depths):
            # Get depth embedding
            depth_idx = torch.tensor([d], device=ocean_embedding.device)
            depth_emb = self.depth_embedding(depth_idx)  # (1, depth_embed_dim)
            depth_emb = depth_emb.expand(B, -1)  # (B, depth_embed_dim)

            # Concatenate ocean embedding with depth embedding
            combined = torch.cat([ocean_embedding, depth_emb], dim=1)  # (B, embed_dim + depth_embed_dim)

            # Decode to temperature map
            temp_flat = self.mlp(combined)  # (B, H*W)
            temp_map = temp_flat.view(B, self.grid_height, self.grid_width)  # (B, H, W)
            outputs.append(temp_map)

        # Stack along depth dimension
        return torch.stack(outputs, dim=1)  # (B, D, H, W)
