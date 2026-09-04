# FRONTEND ARCHITECTURE

## Technology
- React 18 + TypeScript
- Vite (build tool)
- Three.js / React Three Fiber (3D)
- Leaflet (geographic map)
- Recharts (charts)
- CSS Modules or vanilla CSS

## Design System

### Theme: Dark Scientific
- Background: #0a1628 (deep ocean)
- Surface: #1a2744 (panel background)
- Accent: #00d4ff (cyan highlight)
- Text: #e0e6ed (primary), #8899aa (secondary)
- Success: #00c853
- Warning: #ffab00
- Error: #ff5252
- Temperature colormap: viridis/plasma

### Typography
- UI: Inter (Google Fonts)
- Data/Mono: JetBrains Mono

### Layout
```
┌────────────────────────────────────────────────────┐
│  Header: OceanEmbed | Date | Model | Status        │
├──────┬─────────────────────────────────────────────┤
│      │                                              │
│  S   │          Main Visualization                  │
│  i   │    (Map / 3D View toggle)                    │
│  d   │                                              │
│  e   │                                              │
│  b   ├──────────────────────────────────────────────┤
│  a   │  Depth Slider  ▸ 0m ──────────────── 1000m  │
│  r   ├────────────────────┬─────────────────────────┤
│      │  Temperature       │  Metrics / Quality /    │
│      │  Profile Panel     │  Embedding Panel        │
│      │  (Depth vs Temp)   │                         │
└──────┴────────────────────┴─────────────────────────┘
```

## Components

### App Shell
- Dark theme container
- Header with title, date selector, model selector, status indicator
- Sidebar with navigation icons

### Geographic Map (Leaflet)
- Region: 45°E–105°E, 5°N–30°N
- Tile layer: dark ocean tiles
- Prediction heatmap overlay
- Click → select location → show profile
- Coastlines

### 3D Ocean View (Three.js)
- Subsurface temperature volume
- Depth layers as translucent planes
- Temperature → color mapping
- Rotate, zoom, pan
- Depth control
- Grid interaction
- Toggle with map view

### Depth Slider
- 15 discrete positions
- Labels: 0m, 5m, 10m, ..., 1000m
- Updates map layer and 3D view

### Temperature Profile Panel
- Recharts line chart: Depth (y) vs Temperature (x)
- Prediction line + uncertainty shaded band
- Optional: Argo observation points overlay
- Location: lat, lon displayed

### Metrics Panel
- Overall RMSE, MAE, Correlation, R², Bias
- Per-band: Surface, Thermocline, Deep
- Model comparison table (if multiple models)

### Data Quality Panel
- Coverage % per variable (SST, SSS, SSH, etc.)
- Only shows actually computed values
- Color-coded: green (>90%), yellow (>70%), red (<70%)

### Embedding Visualization
- 2D scatter plot of PCA/UMAP embeddings
- Color by region, season, or SST regime
- Interactive tooltip with metadata

## API Integration
- All data fetched from FastAPI backend
- Loading states, error states, empty states handled
- Demo mode: serves pre-computed data
- No fabricated metrics displayed

## Demo Flow
1. Show North Indian Ocean map
2. Select Bay of Bengal region
3. Show surface observations layer
4. Activate reconstruction
5. 3D subsurface view
6. Depth slider: 0→50→100→200→500→1000m
7. Click point → temperature profile
8. Show uncertainty band
9. Show validation metrics
10. Show embedding visualization
