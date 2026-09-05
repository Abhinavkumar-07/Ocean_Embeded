"""
Spatio-Temporal Attention Encoder for OceanEmbed.

Replaces the standard CNN + GRU pipeline with a Vision Transformer (ViT) 
inspired approach that uses a CNN for patch embedding followed by 
Spatio-Temporal Transformer blocks to capture long-range ocean dynamics.
"""

import torch
import torch.nn as nn
from einops import rearrange

class PatchEmbedding(nn.Module):
    """
    Uses a CNN to downsample the high-resolution grid into manageable patches.
    """
    def __init__(self, in_channels: int = 9, embed_dim: int = 128):
        super().__init__()
        # Downsample by 4x4
        self.proj = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, embed_dim, kernel_size=3, padding=1),
            nn.BatchNorm2d(embed_dim),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, C, H, W)
        x = self.proj(x) # (B, embed_dim, H', W')
        # Flatten spatial dimensions
        x = rearrange(x, 'b c h w -> b (h w) c') # (B, N, embed_dim)
        return x

class SpatioTemporalAttentionEncoder(nn.Module):
    """
    Spatio-Temporal Attention (ViT/TimeSformer style)
    
    Input: (B, T, C, H, W)
    Output: (B, embed_dim)
    """
    def __init__(
        self,
        in_channels: int = 9,
        embed_dim: int = 128,
        temporal_window: int = 7,
        num_heads: int = 8,
        num_layers: int = 4,
        dropout: float = 0.1
    ):
        super().__init__()
        self.patch_embed = PatchEmbedding(in_channels=in_channels, embed_dim=embed_dim)
        
        # We need to know the number of spatial patches to create positional embeddings.
        # Assuming H=101, W=241 -> pool(pool(101)) = 25, pool(pool(241)) = 60
        # N = 25 * 60 = 1500 patches. We'll use a dynamic approach or an adaptive pool 
        # to ensure a fixed number of tokens if input shape varies, but for now 
        # let's assume dynamic spatial tokens and add learnable temporal pos embedding.
        
        self.temporal_pos_embed = nn.Parameter(torch.zeros(1, temporal_window, 1, embed_dim))
        
        # Transformer Encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 4,
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # CLS token to summarize the spatio-temporal sequence
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C, H, W = x.shape
        
        # Process each timestep through patch embedding
        # x: (B, T, C, H, W) -> (B*T, C, H, W)
        x_flat = rearrange(x, 'b t c h w -> (b t) c h w')
        
        patches = self.patch_embed(x_flat) # (B*T, N, embed_dim)
        _, N, _ = patches.shape
        
        # Reshape back to (B, T, N, embed_dim)
        patches = rearrange(patches, '(b t) n c -> b t n c', b=B, t=T)
        
        # Add temporal positional embedding
        patches = patches + self.temporal_pos_embed
        
        # Flatten spatio-temporal tokens: (B, T*N, embed_dim)
        tokens = rearrange(patches, 'b t n c -> b (t n) c')
        
        # Prepend CLS token
        cls_tokens = self.cls_token.expand(B, -1, -1) # (B, 1, embed_dim)
        tokens = torch.cat((cls_tokens, tokens), dim=1) # (B, 1 + T*N, embed_dim)
        
        # Pass through Transformer
        out = self.transformer(tokens) # (B, 1 + T*N, embed_dim)
        
        # Return CLS token embedding
        return out[:, 0, :]
