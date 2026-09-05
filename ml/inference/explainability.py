import torch
import torch.nn as nn
import numpy as np

class SaliencyExplainer:
    """
    Generates explainability heatmaps using input gradients (Saliency Maps).
    Shows which spatial regions and variables most influenced the model's prediction 
    at a specific depth or overall.
    """
    def __init__(self, model: nn.Module):
        self.model = model
        
    def generate_heatmap(self, x: torch.Tensor, target_depth_idx: int = None) -> np.ndarray:
        """
        Generate a saliency map for the input tensor.
        
        Args:
            x: (B, T, C, H, W) input tensor
            target_depth_idx: If provided, explains the prediction for a specific depth.
                              If None, explains the overall prediction.
        
        Returns:
            heatmap: (B, H, W) numpy array normalized to [0, 1] representing 
                     spatial importance.
        """
        self.model.eval()
        
        # Ensure input requires grad
        x = x.clone().detach()
        x.requires_grad_(True)
        
        # Forward pass
        pred = self.model(x) # (B, D, H, W)
        
        # Select target for backward pass
        if target_depth_idx is not None:
            # We want to explain the prediction at a specific depth
            score = pred[:, target_depth_idx, :, :].sum()
        else:
            # Explain the overall temperature prediction
            score = pred.sum()
            
        # Backward pass
        self.model.zero_grad()
        score.backward()
        
        # Saliency is the absolute gradient of the input
        # x.grad is (B, T, C, H, W)
        saliency = x.grad.abs()
        
        # To get a spatial heatmap, we can sum/max over Temporal and Channel dimensions
        # (B, T, C, H, W) -> (B, H, W)
        spatial_heatmap = saliency.max(dim=1)[0].max(dim=1)[0]
        
        # Normalize to [0, 1] per item in batch
        spatial_heatmap = spatial_heatmap.cpu().numpy()
        for i in range(spatial_heatmap.shape[0]):
            sh = spatial_heatmap[i]
            sh_max = sh.max()
            sh_min = sh.min()
            if sh_max > sh_min:
                spatial_heatmap[i] = (sh - sh_min) / (sh_max - sh_min)
            else:
                spatial_heatmap[i] = np.zeros_like(sh)
                
        return spatial_heatmap
