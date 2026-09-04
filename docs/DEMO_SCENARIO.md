# DEMO SCENARIO

## Duration: 2–4 minutes

## Story

### Step 1 — Context (15s)
Show OceanEmbed title and North Indian Ocean map.
"We're looking at the North Indian Ocean — from the Arabian Sea to the Bay of Bengal."

### Step 2 — The Problem (15s)
"Satellites can only see the ocean surface. But understanding what happens below the surface is critical for monsoon prediction, fisheries, and climate science."

### Step 3 — Surface Observations (20s)
Show surface data layers on the map.
Toggle through: SST, SSS, SSH.
"These are our satellite inputs — temperature, salinity, sea level height."

### Step 4 — The Model (15s)
Show architecture diagram briefly.
"OceanEmbed uses a CNN + GRU deep learning model that learns from 7 days of surface observations to reconstruct subsurface temperature."

### Step 5 — Reconstruction (30s)
Activate prediction layer on map.
"Here's the reconstructed temperature field."
Move depth slider: 0m → 50m → 100m → 200m → 500m → 1000m.
"Watch how the temperature structure changes with depth."

### Step 6 — 3D View (20s)
Toggle to Three.js 3D ocean view.
Rotate, zoom to show depth layers.
"This is the full 3D subsurface temperature volume our model has reconstructed."

### Step 7 — Temperature Profile (20s)
Click a point in Bay of Bengal.
Show depth vs temperature profile chart.
"At this location, we can see the full temperature profile from surface to 1000 meters."
Highlight the thermocline region.

### Step 8 — Uncertainty (15s)
Show uncertainty band on the profile.
"The shaded region shows our model's confidence. Notice it's wider in the thermocline — that's where prediction is hardest."

### Step 9 — Validation (20s)
Show metrics panel.
"We validated against both holdout reanalysis data and independent Argo float observations."
Show RMSE by depth chart.

### Step 10 — Embedding Analysis (15s)
Show embedding scatter plot.
"The model has learned meaningful ocean representations — different regions and seasons cluster naturally."

### Step 11 — Conclusion (10s)
"OceanEmbed: from surface satellite observations to subsurface ocean intelligence."

## Key Points to Emphasize
1. Multi-source satellite fusion (not just SST)
2. Temporal context (7-day history)
3. Depth-aware reconstruction (not independent predictions)
4. Thermocline performance
5. Uncertainty quantification
6. Independent validation
7. Interactive 3D visualization
