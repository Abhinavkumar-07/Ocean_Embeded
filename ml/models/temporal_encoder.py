"""
GRU Temporal Encoder for OceanEmbed.

Processes a sequence of spatial embeddings (one per day)
and outputs a single temporal representation.
"""

import torch
import torch.nn as nn


class TemporalEncoder(nn.Module):
    """
    GRU-based temporal encoder.
    
    Input:  (B, T, embed_dim) — sequence of daily spatial embeddings
    Output: (B, embed_dim) — temporal representation
    """

    def __init__(
        self,
        embed_dim: int = 128,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.1,
        bidirectional: bool = False,
    ):
        super().__init__()
        self.gru = nn.GRU(
            input_size=embed_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=bidirectional,
        )
        
        # Project back to embed_dim if needed
        gru_output_size = hidden_size * (2 if bidirectional else 1)
        self.project = nn.Linear(gru_output_size, embed_dim) if gru_output_size != embed_dim else nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, T, embed_dim) sequence of spatial embeddings
        Returns:
            (B, embed_dim) temporal representation
        """
        output, hidden = self.gru(x)  # output: (B, T, hidden*dirs)
        
        # Use the last timestep's output
        last_output = output[:, -1, :]  # (B, hidden*dirs)
        
        return self.project(last_output)  # (B, embed_dim)
