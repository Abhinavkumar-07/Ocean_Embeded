# PROJECT OVERVIEW

## Problem Statement
**SIH26066** — OceanEmbed: Satellite Embedding-Based Deep Learning Framework for Reconstruction of Subsurface Ocean Temperature from Surface Satellite Observations.

## Scientific Objective
Reconstruct subsurface ocean temperature profiles at 15 standard depth levels from satellite-derived surface observations using deep learning, with emphasis on the thermocline region and uncertainty quantification.

## Geographic Domain
- **Region**: North Indian Ocean
- **Latitude**: 5°N → 30°N
- **Longitude**: 45°E → 105°E
- **Spatial Resolution**: 0.25° × 0.25°
- **Temporal Resolution**: Daily

## Required Depths (meters)
0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000

## Core Inputs
| Channel | Variable |
|:---|:---|
| 1 | SST (Sea Surface Temperature) |
| 2 | SSS (Sea Surface Salinity) |
| 3 | SSH/SLA (Sea Surface Height / Sea Level Anomaly) |
| 4 | Surface Current U (eastward) |
| 5 | Surface Current V (northward) |
| 6 | Surface Wind U (eastward) |
| 7 | Surface Wind V (northward) |

## Target
Temperature at 15 depths: `Y ∈ R^(D × H × W)` where D = 15

## High-Level Architecture
```
Surface observations (T × C × H × W)
    → CNN Spatial Encoder (per timestep)
    → Temporal Encoder (GRU)
    → Ocean Embedding (128-d)
    → Depth-Aware Decoder
    → Temperature(depth) + Uncertainty
```

## Key Differentiators
1. **Multi-source fusion** — 7 surface variables, not just SST
2. **Temporal context** — 7-day windows capture ocean dynamics
3. **Depth-aware decoding** — learned depth embeddings, not independent regressions
4. **Thermocline focus** — weighted loss for transition zone accuracy
5. **Uncertainty estimation** — MC Dropout confidence intervals
6. **Embedding analysis** — interpretable learned ocean representations
7. **Interactive 3D visualization** — Three.js subsurface exploration

## Technology Stack
- **ML**: Python, PyTorch, xarray, NumPy, pandas, SciPy, scikit-learn, matplotlib
- **Backend**: FastAPI, Pydantic, uvicorn
- **Frontend**: React, TypeScript, Vite, Three.js, React Three Fiber, Leaflet, Recharts
- **Data**: NetCDF, Copernicus Marine Toolbox, argopy
