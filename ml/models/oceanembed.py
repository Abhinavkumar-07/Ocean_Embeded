"""
Full OceanEmbed model.

Spatial Encoder (CNN) → Temporal Encoder (GRU) → Depth-Aware Decoder
Supports MC Dropout for uncertainty estimation.
"""

import torch
import torch.nn as nn
from typing import Dict, Optional, Tuple

from ml.models.spatial_encoder import SpatialEncoder
from ml.models.temporal_encoder import TemporalEncoder
try:
    from ml.models.attention_encoder import SpatioTemporalAttentionEncoder
except ImportError:
    SpatioTemporalAttentionEncoder = None

from ml.models.depth_decoder import DepthAwareDecoder
from ml.constants import NUM_DEPTHS, DEFAULT_EMBEDDING_DIM


class OceanEmbedModel(nn.Module):
    """
    Full OceanEmbed architecture:
    
    Input:  (B, T, C, H, W) — temporal sequence of surface observations
    Output: (B, D, H, W) — temperature at D depth levels
    
    Pipeline:
        For each timestep t:
            spatial_embedding[t] = SpatialEncoder(x[:, t])
        temporal_embedding = TemporalEncoder([spatial_embedding[0..T]])
        temperature = DepthAwareDecoder(temporal_embedding)
    """

    def __init__(
        self,
        in_channels: int = 9,
        embed_dim: int = DEFAULT_EMBEDDING_DIM,
        temporal_window: int = 7,
        num_depths: int = NUM_DEPTHS,
        depth_embed_dim: int = 32,
        gru_layers: int = 2,
        grid_height: int = 61,
        grid_width: int = 61,
        dropout: float = 0.1,
        decoder_dropout: float = 0.2,
        encoder_type: str = "cnn_gru", # "attention" or "cnn_gru"
    ):
        super().__init__()
        self.temporal_window = temporal_window
        self.embed_dim = embed_dim
        self.encoder_type = encoder_type

        if self.encoder_type == "cnn_gru":
            # Spatial encoder (shared across timesteps)
            self.spatial_encoder = SpatialEncoder(
                in_channels=in_channels,
                embed_dim=embed_dim,
                dropout=dropout,
            )

            # Temporal encoder
            self.temporal_encoder = TemporalEncoder(
                embed_dim=embed_dim,
                hidden_size=embed_dim,
                num_layers=gru_layers,
                dropout=dropout,
            )
        elif self.encoder_type == "attention":
            self.spatio_temporal_encoder = SpatioTemporalAttentionEncoder(
                in_channels=in_channels,
                embed_dim=embed_dim,
                temporal_window=temporal_window,
                num_heads=8,
                num_layers=4,
                dropout=dropout
            )
        else:
            raise ValueError(f"Unknown encoder_type: {encoder_type}")

        # Depth-aware decoder
        self.depth_decoder = DepthAwareDecoder(
            embed_dim=embed_dim,
            num_depths=num_depths,
            depth_embed_dim=depth_embed_dim,
            grid_height=grid_height,
            grid_width=grid_width,
            dropout=decoder_dropout,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, T, C, H, W) temporal sequence of surface observations
        Returns:
            (B, D, H, W) temperature predictions at D depths
        """
        B, T, C, H, W = x.shape

        if self.encoder_type == "cnn_gru":
            # Encode each timestep spatially
            spatial_embeddings = []
            for t in range(T):
                emb = self.spatial_encoder(x[:, t])  # (B, embed_dim)
                spatial_embeddings.append(emb)

            # Stack to sequence: (B, T, embed_dim)
            spatial_seq = torch.stack(spatial_embeddings, dim=1)

            # Temporal encoding
            ocean_embedding = self.temporal_encoder(spatial_seq)  # (B, embed_dim)
        else:
            # Spatio-Temporal Attention encoding
            ocean_embedding = self.spatio_temporal_encoder(x) # (B, embed_dim)

        # Depth-aware decoding
        temperature = self.depth_decoder(ocean_embedding)  # (B, D, H, W)

        return temperature

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Extract the ocean embedding without decoding (for analysis)."""
        if self.encoder_type == "cnn_gru":
            B, T, C, H, W = x.shape
            spatial_embeddings = []
            for t in range(T):
                emb = self.spatial_encoder(x[:, t])
                spatial_embeddings.append(emb)
            spatial_seq = torch.stack(spatial_embeddings, dim=1)
            return self.temporal_encoder(spatial_seq)
        else:
            return self.spatio_temporal_encoder(x)

    def predict_with_uncertainty(
        self, x: torch.Tensor, n_samples: int = 20
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        MC Dropout uncertainty estimation.
        
        Args:
            x: (B, T, C, H, W) input
            n_samples: number of forward passes
        Returns:
            mean: (B, D, H, W) mean prediction
            std: (B, D, H, W) prediction uncertainty
        """
        self.train()  # Enable dropout
        predictions = []
        
        with torch.no_grad():
            for _ in range(n_samples):
                pred = self.forward(x)
                predictions.append(pred)

        preds = torch.stack(predictions)  # (N, B, D, H, W)
        mean = preds.mean(dim=0)
        std = preds.std(dim=0)

        self.eval()
        return mean, std
