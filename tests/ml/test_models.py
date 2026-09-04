"""
Basic tests for ML model shapes and outputs.
"""

import pytest
import torch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.models.spatial_encoder import SpatialEncoder
from ml.models.temporal_encoder import TemporalEncoder
from ml.models.depth_decoder import DepthAwareDecoder
from ml.models.baseline import BaselineCNN
from ml.models.oceanembed import OceanEmbedModel
from ml.constants import NUM_DEPTHS


# Use small grid for fast tests
TEST_H, TEST_W = 16, 16
TEST_B = 2
TEST_T = 7
TEST_C = 7


class TestSpatialEncoder:
    def test_output_shape(self):
        model = SpatialEncoder(in_channels=TEST_C, embed_dim=128)
        x = torch.randn(TEST_B, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert out.shape == (TEST_B, 128)

    def test_no_nan(self):
        model = SpatialEncoder(in_channels=TEST_C, embed_dim=128)
        x = torch.randn(TEST_B, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert not torch.isnan(out).any()


class TestTemporalEncoder:
    def test_output_shape(self):
        model = TemporalEncoder(embed_dim=128, hidden_size=128)
        x = torch.randn(TEST_B, TEST_T, 128)
        out = model(x)
        assert out.shape == (TEST_B, 128)

    def test_no_nan(self):
        model = TemporalEncoder(embed_dim=128)
        x = torch.randn(TEST_B, TEST_T, 128)
        out = model(x)
        assert not torch.isnan(out).any()


class TestDepthDecoder:
    def test_output_shape(self):
        model = DepthAwareDecoder(
            embed_dim=128, grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, 128)
        out = model(x)
        assert out.shape == (TEST_B, NUM_DEPTHS, TEST_H, TEST_W)


class TestBaselineCNN:
    def test_output_shape(self):
        model = BaselineCNN(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert out.shape == (TEST_B, NUM_DEPTHS, TEST_H, TEST_W)

    def test_handles_temporal_input(self):
        model = BaselineCNN(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_T, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert out.shape == (TEST_B, NUM_DEPTHS, TEST_H, TEST_W)


class TestOceanEmbedModel:
    def test_output_shape(self):
        model = OceanEmbedModel(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_T, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert out.shape == (TEST_B, NUM_DEPTHS, TEST_H, TEST_W)

    def test_get_embedding(self):
        model = OceanEmbedModel(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_T, TEST_C, TEST_H, TEST_W)
        emb = model.get_embedding(x)
        assert emb.shape == (TEST_B, 64)

    def test_gradient_flow(self):
        model = OceanEmbedModel(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_T, TEST_C, TEST_H, TEST_W)
        out = model(x)
        loss = out.mean()
        loss.backward()
        
        # Check that all parameters got gradients
        for name, param in model.named_parameters():
            if param.requires_grad:
                assert param.grad is not None, f"No gradient for {name}"

    def test_no_nan_output(self):
        model = OceanEmbedModel(
            in_channels=TEST_C, embed_dim=64,
            grid_height=TEST_H, grid_width=TEST_W
        )
        x = torch.randn(TEST_B, TEST_T, TEST_C, TEST_H, TEST_W)
        out = model(x)
        assert not torch.isnan(out).any()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
