# ML ARCHITECTURE

> [!WARNING] 
> **Implementation Status: PRECOMPUTED DEMO**
> 
> **Current Prototype:**
> - Deterministic demo inference is used across the application.
> - Architecture selection in the UI correctly alters the deterministic configuration/output signature.
> - **No trained neural network** is currently executing.
> - **No PyTorch inference** is currently connected to the application backend.
> 
> **Future ML Implementation:**
> The architectures detailed below (Baseline CNN, CNN + GRU, OceanEmbed depth-aware architecture) represent the intended real ML topologies to be trained and deployed. They are not yet fully implemented.
> 
> **First Real-Data Experiment (Pending):**
> Before implementing the full training pipeline, the first milestone will be an overfit test using a tiny vertical slice of real data (e.g. 1 sample → 1 batch → Baseline CNN → Loss calculation).

## Model Overview

### Input Tensor
```
X ∈ R^(B × T × C × H × W)

B = batch size
T = temporal window (default 7)
C = input channels (7 surface variables + optional masks)
H = latitude dimension
W = longitude dimension
```

### Output Tensor
```
Y ∈ R^(B × D × H × W)

D = 15 depth levels
```

## Architecture Components

### 1. Spatial Encoder (CNN)

Processes one timestep at a time:
```
Input: (B, C, H, W)
    → Conv2d(C, 32, 3, padding=1) + BN + ReLU
    → Conv2d(32, 64, 3, padding=1) + BN + ReLU + MaxPool
    → Conv2d(64, 128, 3, padding=1) + BN + ReLU + MaxPool
    → Conv2d(128, 128, 3, padding=1) + BN + ReLU
    → AdaptiveAvgPool2d(1)
    → Flatten
Output: (B, embed_dim=128)
```

Configurable embed_dim: 64, 128, 256

### 2. Temporal Encoder (GRU)

Processes sequence of spatial embeddings:
```
Input: (B, T, embed_dim)
    → GRU(embed_dim, embed_dim, num_layers=2, dropout=0.1)
    → Take final hidden state
Output: (B, embed_dim)
```

### 3. Depth-Aware Decoder

Uses learned depth embeddings:
```
Depth embeddings: (D, depth_embed_dim=32)

For each depth d:
    Input: concat(ocean_embedding, depth_embedding[d])
    → Linear(embed_dim + depth_embed_dim, 256) + ReLU + Dropout
    → Linear(256, 128) + ReLU + Dropout
    → Linear(128, H × W)
    → Reshape to (H, W)
Output: (B, D, H, W)
```

### 4. Baseline Model (no temporal)
```
Input: (B, C, H, W)  # single timestep
    → Spatial Encoder
    → MLP Decoder (no depth embeddings)
Output: (B, D, H, W)
```

## Loss Functions

### MSE (baseline)
```
L = mean((Y_pred - Y_true)²)
```

### Thermocline-Weighted Loss
```
L = L_surface + λ_thermo * L_thermo + λ_deep * L_deep

Surface:     depths 0–50m    (indices 0–5)
Thermocline: depths 75–300m  (indices 6–11)
Deep:        depths 500–1000m (indices 12–14)
```

Default weights: λ_thermo = 2.0, λ_deep = 1.0

### Huber Loss
For robustness against outliers.

## Uncertainty Estimation

### MC Dropout
1. Enable dropout at inference time
2. Run N forward passes (default N=20)
3. Mean → prediction
4. Std → uncertainty
5. Quantiles → confidence intervals

## Training Configuration

```yaml
seed: 42
temporal_window: 7
embedding_dim: 128
batch_size: 16
learning_rate: 0.001
epochs: 100
loss:
  type: thermocline_weighted
  thermocline_weight: 2.0
  deep_weight: 1.0
optimizer:
  type: AdamW
  weight_decay: 0.01
scheduler:
  type: cosine
  T_max: 100
early_stopping:
  patience: 15
  min_delta: 0.001
```

## Ablation Experiments

### Temporal Window
- T=1 (single day)
- T=3
- T=5
- T=7

### Input Variables
- All 7 variables
- Remove SST
- Remove SSS
- Remove SSH
- Remove currents
- Remove winds

### Architecture
- CNN baseline (no temporal)
- CNN + GRU
- CNN + temporal attention (if time permits)

## Standard Depths (meters)
```
[0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000]
```

## Depth Bands for Evaluation
```
Surface:     0, 5, 10, 20, 30, 50 m
Thermocline: 75, 100, 125, 150, 200, 300 m
Deep:        500, 700, 1000 m
```

## Validation
The validation layer has been integrated in Phase 6, explicitly separating GLORYS (training target) from ARGO (independent validation).
