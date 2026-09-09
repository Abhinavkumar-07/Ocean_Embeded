# Dataset Catalog

This document details the target raw datasets for the OceanEmbed pipeline. All operational data is sourced from the Copernicus Marine Environment Monitoring Service (CMEMS).

## 1. Subsurface Target (GLORYS12V1)

**Product ID**: `GLOBAL_MULTIYEAR_PHY_001_030`
**Dataset**: `cmems_mod_glo_phy_my_0.083_P1D-m`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]

GLORYS12V1 is the CMEMS global ocean eddy-resolving reanalysis. We use this as our "ground truth" target for training the subsurface temperature prediction model.

- **Variables**: `thetao` (Sea water potential temperature)
- **Resolution**: 1/12° (approx. 8km)
- **Temporal**: Daily mean
- **Depths**: Selected 15 standard depths between 0 and 1000m.

## 2. Surface Inputs (L4 Observations)

### 2.1 Sea Surface Temperature (OSTIA)
**Product ID**: `SST_GLO_SST_L4_REP_OBSERVATIONS_010_011`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]
- **Variable**: `analysed_sst`
- **Resolution**: 0.05°
- **Description**: High-resolution, gap-free foundation SST.

### 2.2 Sea Surface Salinity (SMOS/SMAP)
**Product ID**: `MULTIOBS_GLO_PHY_S_SURFACE_MYNRT_015_013`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]
- **Variable**: `sos` (Sea surface salinity)
- **Resolution**: 0.25°
- **Description**: Multi-observation mapped SSS.

### 2.3 Sea Level (Altimetry)
**Product ID**: `SEALEVEL_GLO_PHY_L4_MY_008_047`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]
- **Variable**: `sla` (Sea Level Anomaly), `adt` (Absolute Dynamic Topography)
- **Resolution**: 0.25°
- **Description**: Gridded multi-mission altimetry.

### 2.4 Surface Winds (ASCAT)
**Product ID**: `WIND_GLO_WIND_L4_REP_OBSERVATIONS_012_006`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]
- **Variable**: `eastward_wind`, `northward_wind`
- **Resolution**: 0.25°
- **Description**: Blended wind product.

### 2.5 Surface Currents (GlobCurrent)
**Product ID**: `MULTIOBS_GLO_PHY_REP_015_004`
**Status**: [MISSING LOCALLY - REQUIRES CMEMS DOWNLOAD]
- **Variable**: `ugos`, `vgos` (Geostrophic + Ekman currents)
- **Resolution**: 0.25°
- **Description**: Observation-based surface currents.

## 3. Validation Data (In-situ)

**Source**: Argo Float Network (via `argopy` or CMEMS `INSITU_GLO_PHY_TS_DISCRETE_MY_013_001`)
**Status**: [MISSING LOCALLY - REQUIRES DOWNLOAD]

Argo profiling floats are used for independent, out-of-sample physical validation of the model's predictions. These are purely observational point measurements, unassimilated by the baseline model.
