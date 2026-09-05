import torch
import torch.nn as nn
import torch.nn.functional as F

class ThermoclineWeightedLoss(nn.Module):
    """
    Weighted MSE loss prioritizing the thermocline region.
    Surface: depths 0-50m (indices 0-5)
    Thermocline: depths 75-300m (indices 6-11)
    Deep: depths 500-1000m (indices 12-14)
    """
    def __init__(self, thermo_weight: float = 2.0, deep_weight: float = 1.0):
        super().__init__()
        self.thermo_weight = thermo_weight
        self.deep_weight = deep_weight

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # pred, target shape: (B, D, H, W)
        
        # Calculate standard MSE per depth level
        mse = F.mse_loss(pred, target, reduction='none') # (B, D, H, W)
        mse_per_depth = mse.mean(dim=(0, 2, 3)) # (D,)
        
        # We assume 15 depth levels
        if mse_per_depth.shape[0] != 15:
            # Fallback if D != 15
            return mse.mean()
            
        surface_loss = mse_per_depth[0:6].mean()
        thermo_loss = mse_per_depth[6:12].mean()
        deep_loss = mse_per_depth[12:15].mean()
        
        total_loss = surface_loss + (self.thermo_weight * thermo_loss) + (self.deep_weight * deep_loss)
        return total_loss


class PhysicsInformedLoss(nn.Module):
    """
    Physics-Informed Neural Network (PINN) loss for ocean temperature.
    
    Ocean temperature typically decreases with depth (ignoring complex 
    salinity-driven inversions). We can penalize temperature inversions 
    where T(depth_i) < T(depth_i+1) to ensure physical consistency.
    
    L_total = L_data(MSE) + lambda_phys * L_physics
    """
    def __init__(self, data_loss_fn: nn.Module = nn.MSELoss(), lambda_phys: float = 0.5):
        super().__init__()
        self.data_loss_fn = data_loss_fn
        self.lambda_phys = lambda_phys

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # pred shape: (B, D, H, W)
        data_loss = self.data_loss_fn(pred, target)
        
        # Physics loss: penalize if pred[:, d+1] > pred[:, d]
        # temp_diff = T_{d+1} - T_d
        temp_diff = pred[:, 1:, :, :] - pred[:, :-1, :, :]
        
        # We only penalize positive differences (inversions)
        # Using ReLU to get positive diffs
        inversions = F.relu(temp_diff)
        
        # Mean inversion penalty
        physics_loss = inversions.mean()
        
        return data_loss + (self.lambda_phys * physics_loss)
