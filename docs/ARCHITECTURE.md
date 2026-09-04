# ARCHITECTURE

## System Overview

OceanEmbed consists of two major systems:

### A. Scientific/ML Engine
```
Raw datasets → Data ingestion → Quality control → Spatial/temporal harmonization
→ Missing-data handling → Training sample generation → Spatial encoder
→ Temporal encoder → Ocean embedding → Depth-aware reconstruction
→ Temperature profile → Uncertainty estimation → Validation
```

### B. Demonstration Platform
```
ML outputs → Prediction API → Frontend → Interactive map
→ 3D ocean visualization → Depth exploration → Temperature profile
→ Uncertainty → Model metrics
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + TypeScript + Vite                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Map      │ │ 3D View  │ │ Charts   │ │ Controls         │  │
│  │ (Leaflet)│ │(Three.js)│ │(Recharts)│ │(Depth/Date/Model)│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────┴─────────────────────────────────────┐
│                         BACKEND                                  │
│  FastAPI + Pydantic                                              │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐ │
│  │ API      │ │ Inference    │ │ Data      │ │ Demo         │ │
│  │ Routes   │ │ Service      │ │ Service   │ │ Service      │ │
│  └──────────┘ └──────┬───────┘ └───────────┘ └──────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │ PyTorch
┌──────────────────────┴──────────────────────────────────────────┐
│                        ML ENGINE                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   OceanEmbed Model                        │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │  │
│  │  │ CNN Spatial  │→ │ GRU Temp   │→ │ Depth-Aware      │  │  │
│  │  │ Encoder      │  │ Encoder    │  │ Decoder           │  │  │
│  │  └─────────────┘  └────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Data       │ │ Training   │ │ Evaluation │ │ Inference  │ │
│  │ Pipeline   │ │ Engine     │ │ Engine     │ │ Engine     │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                     DATA LAYER                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ SST        │ │ SSS        │ │ SSH/SLA    │ │ Currents   │ │
│  │ Adapter    │ │ Adapter    │ │ Adapter    │ │ Adapter    │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│  │ Wind       │ │ GLORYS     │ │ Argo       │                │
│  │ Adapter    │ │ (target)   │ │ (valid.)   │                │
│  └────────────┘ └────────────┘ └────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Training Flow
```
Raw NetCDF files (data/raw/)
    → Dataset Adapters (ml/data/adapters/)
    → Harmonizer: regrid to 0.25°, daily (ml/data/harmonizer.py)
    → Quality Control (ml/data/quality.py)
    → Missing Data Handler (ml/data/missing_data.py)
    → Sample Generator (scripts/create_samples.py)
    → PyTorch Dataset (ml/data/dataset.py)
    → DataLoader
    → Trainer (ml/training/trainer.py)
    → Checkpoint (artifacts/checkpoints/)
```

### Inference Flow
```
Surface observations
    → Normalize (using training statistics)
    → Model forward pass
    → MC Dropout (N passes)
    → Mean prediction + uncertainty
    → API response
```

## Configuration
All experiments are config-driven via YAML files in `configs/`:
- `data.yaml` — Data pipeline settings
- `model.yaml` — Model architecture
- `training.yaml` — Training hyperparameters
- `demo.yaml` — Demo mode settings
