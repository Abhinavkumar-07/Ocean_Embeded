# Phase 8: Real Data Status Report

**Objective:** Transition OceanEmbed from synthetic demo data to real oceanographic data without silent corruption, leakage, or synthetic substitution.

## 1. CMEMS Data Ingestion & Provenance

**Authentication Status:** ✅ SUCCESS (Copernicus Marine Toolbox v2.4.1, local mechanism)

| Component | Status | Configured Dataset ID | Verified Dataset ID | Product ID |
| :--- | :--- | :--- | :--- | :--- |
| **GLORYS (Target)** | ✅ INSPECTED | `cmems_mod_glo_phy_my_0.083deg_P1D-m` | `cmems_mod_glo_phy_my_0.083deg_P1D-m` | `GLOBAL_MULTIYEAR_PHY_001_030` |
| **OSTIA SST** | ✅ INSPECTED | `C3S-GLO-SST-L4-REP-OBS-SST` | `C3S-GLO-SST-L4-REP-OBS-SST` | `SST_GLO_SST_L4_REP_OBSERVATIONS_010_011` |
| **SMOS SSS** | ✅ INSPECTED | `cmems_obs-mob_glo_phy-sss_my_multi_P1D` (updated) | `cmems_obs-mob_glo_phy-sss_my_multi_P1D` | `MULTIOBS_GLO_PHY_S_SURFACE_MYNRT_015_013` |
| **Altimetry SSH** | ✅ INSPECTED | `cmems_obs-sl_glo_phy-ssh_my_allsat-l4-duacs-0.125deg_P1D` (updated) | `cmems_obs-sl_glo_phy-ssh_my_allsat-l4-duacs-0.125deg_P1D` | `SEALEVEL_GLO_PHY_L4_MY_008_047` |
| **ASCAT Winds** | ✅ INSPECTED | `cmems_obs-wind_glo_phy_my_l4_0.125deg_PT1H` (updated) | `cmems_obs-wind_glo_phy_my_l4_0.125deg_PT1H` | `WIND_GLO_PHY_L4_MY_012_006` (updated) |
| **GlobCurrent** | ✅ INSPECTED | `cmems_obs-mob_glo_phy-cur_my_0.25deg_P1D-m` (updated) | `cmems_obs-mob_glo_phy-cur_my_0.25deg_P1D-m` | `MULTIOBS_GLO_PHY_MYNRT_015_003` (updated) |

## 2. GLORYS Smoke Test Inspection

The single real GLORYS subset was downloaded successfully (`glorys_target_subset.nc`, 45.35 MB) for January 2022 in the Bay of Bengal.

### Data Sanity & Properties
- **Variable**: `thetao` (Potential Temperature)
- **Units**: `degrees_C`
- **Native Dimensions**: `time: 31, depth: 35, latitude: 121, longitude: 181`
- **Spatial Bounds**: Longitude `80.0 to 95.0`, Latitude `10.0 to 20.0`
- **Time Bounds**: `2022-01-01` to `2022-01-31`
- **Missing Values**: 17.38% (Expected, due to landmask overlaying the ocean grid)
- **Provenance**: `MERCATOR GLORYS12V1`

### Depth Mapping (Native to Canonical 15)
The native dataset contains **35 depth levels** ranging from 0.49m to 902.34m in this slice, heavily biased toward the surface. It does **not** natively match the 15 canonical depths exactly.

| Canonical Target (m) | Nearest Native GLORYS (m) | Absolute Error (m) |
| :--- | :--- | :--- |
| 0 | 0.49 | 0.49 |
| 5 | 5.08 | 0.08 |
| 10 | 9.57 | 0.43 |
| 20 | 18.50 | 1.50 |
| 30 | 29.44 | 0.56 |
| 50 | 47.37 | 2.63 |
| 75 | 77.85 | 2.85 |
| 100 | 92.33 | 7.67 |
| 125 | 130.67 | 5.67 |
| 150 | 155.85 | 5.85 |
| 200 | 186.13 | 13.87 |
| 300 | 318.13 | 18.13 |
| 500 | 541.09 | 41.09 |
| 700 | 643.57 | 56.43 |
| 1000 | 902.34 | 97.66 |

> [!WARNING]
> **Depth Coverage Limitation**
> The deepest native level returned in the downloaded slice is `902.34m`. 
> The 1000m target is currently: **UNRESOLVED / OUTSIDE NATIVE DEPTH COVERAGE**
> Do NOT silently extrapolate or nearest-neighbor fill 1000m.
> 
> *Catalogue Verification:* The native GLORYS dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m` DOES contain deeper levels (e.g., `1062.44m`). The subset download parameter (`--maximum-depth 1050.0`) failed to capture the `1062.44m` bounding level. A future redownload with `--maximum-depth 1100.0` will be required to properly interpolate to exactly 1000m.

## 3. OSTIA SST Smoke Test Inspection

The single real OSTIA L4 analysed SST product subset was downloaded successfully (`ostia_sst_subset.nc`, 3.58 MB) for January 2022 in the Bay of Bengal.

### Data Sanity & Properties
- **Variable**: `analysed_sst`
- **Units**: `kelvin`
- **Native Dimensions**: `time: 31, latitude: 200, longitude: 300` (Surface level only)
- **Spatial Bounds**: Longitude `80.025 to 94.975`, Latitude `10.025 to 19.975` (Native 0.05° grid spacing)
- **Time Bounds**: `2022-01-01` to `2022-01-31`
- **Missing Values**: 12.09%. (This is specifically the land/coastal mask, distinct from genuinely missing ocean observations. Genuine ocean gaps are filled in this L4 analysis).
- **Provenance**: `Danish Meteorological Institute, DMI (ESA SST CCI v3.0 and C3S v3.0 L3U)` (L4 Processing Level).

## 4. SMOS/Multi-Obs SSS Smoke Test Inspection

The real SSS target subset (Bay of Bengal, Jan 2022) was downloaded successfully (`sss_subset.nc`, 1.16 MB).

### Data Sanity & Properties
- **Variable**: `sos` (Sea Surface Salinity)
- **Units**: `.001` (PSU)
- **Native Dimensions**: `time: 31, depth: 1, latitude: 80, longitude: 120` 
- **Spatial Bounds**: Longitude `80.0625 to 94.9375`, Latitude `10.0625 to 19.9375` (Native 0.125° grid spacing)
- **Time Bounds**: `2022-01-01` to `2022-01-31`
- **Missing Values**: 12.49% (Land/coastal mask, distinct from missing ocean observations).
- **Provenance**: `CNR, Global Analysed Sea Surface Salinity and Density` (Multi-sensor L4 Analysis).

## 5. Altimetry SSH/SLA Smoke Test Inspection

The real SSH/SLA target subset (Bay of Bengal, Jan 2022) was downloaded successfully (`ssh_subset.nc`, 2.30 MB).

### Data Sanity & Properties
- **Native Dimensions**: `time: 31, latitude: 80, longitude: 120` (Surface data).
- **Spatial Bounds**: Longitude `80.0625 to 94.9375`, Latitude `10.0625 to 19.9375` (Native 0.125° grid spacing, identical to SSS).
- **Time Bounds**: `2022-01-01` to `2022-01-31`
- **Missing Values**: 11.68% (Land/coastal mask).
- **Provenance**: `CLS, CNES (Altimetry measurements) DT merged all satellites Global Ocean Gridded SSALTO/DUACS` (L4 Processing Level).

### Physical Quantity Verification
The verified DUACS dataset provides **both** Absolute Dynamic Topography (`adt`) and Sea Level Anomaly (`sla`). They are NOT interchangeable.

**Selected Physical Quantity**:
* **Source Variable**: `adt`
* **Canonical OceanEmbed Variable**: `ssh` 
* **Physical Quantity**: Absolute Dynamic Topography (ADT)
* **Physical Units**: `m` (meters)
* **Physical Conversion**: None (GLORYS and standard equations use meters)
* **ML Normalization**: ML normalization (standardization to zero mean/unit variance) will occur later, using statistics computed strictly from the training split. Do not fit normalization parameters on validation/test data.

## 6. ASCAT Surface Winds Smoke Test Inspection

The verified ASCAT L4 Wind product subset was downloaded (`ascat_subset.nc`, 27.27 MB).

### Data Sanity & Properties
- **Temporal Resolution**: Hourly (`PT1H`), meaning 744 time steps for January 2022. This is **NOT** a daily mean product natively.
- **Native Dimensions**: `time: 744, latitude: 80, longitude: 120`.
- **Spatial Bounds**: Longitude `80.0625 to 94.9375`, Latitude `10.0625 to 19.9375` (Native 0.125° grid, identical to SSS and SSH).
- **Time Bounds**: `2022-01-01T00:00:00` to `2022-01-31T23:00:00`.
- **Missing Values**: 0.00% (The blended scatterometer+model product fills missing coastal/ocean gaps).
- **Provenance**: `Royal Netherlands Meteorological Institute (KNMI) - Global Ocean Wind and Stress Hourly Reprocessed From Scatterometer and Model`.

### Canonical Transformation & Physics Mapping
We require U and V components separated as physical inputs, not magnitude/direction.

**Wind U Component**:
* **Source Variable**: `eastward_wind`
* **Canonical OceanEmbed Variable**: `wind_u`
* **Physical Units**: `m s-1` (meters per second)
* **Physical Conversion**: None.
* **ML Normalization**: Zero mean/unit variance later against training-split statistics.

**Wind V Component**:
* **Source Variable**: `northward_wind`
* **Canonical OceanEmbed Variable**: `wind_v`
* **Physical Units**: `m s-1`
* **Physical Conversion**: None.
* **ML Normalization**: Zero mean/unit variance later against training-split statistics.

## 7. GlobCurrent Surface Currents Smoke Test Inspection

The verified GlobCurrent L4 subset was downloaded (`globcurrent_subset.nc`, 0.59 MB). 
*(Note: The product ID was updated to `MULTIOBS_GLO_PHY_MYNRT_015_003` reflecting the latest CMEMS catalogue merger).*

### Data Sanity & Properties
- **Temporal Resolution**: Daily Mean (`P1D`). This is a composite temporal product, not instantaneous.
- **Native Dimensions**: `time: 31, depth: 2, latitude: 40, longitude: 60`.
- **Spatial Bounds**: Longitude `80.125 to 94.875`, Latitude `10.125 to 19.875` (Native 0.25° grid, but offset from our canonical integer grid).
- **Time Bounds**: `2022-01-01T00:00:00` to `2022-01-31T00:00:00` (Exactly matches GLORYS/SST/SSS sequence).
- **Depth Levels**: `[0.0, 15.0]`. We require purely surface currents, so the `depth=0` slice must be extracted.
- **Missing Values**: 12.58% (Land/coastal mask, distinct from missing ocean data).
- **Provenance**: `CLS - Daily mean total surface and 15m velocities` (Observation-derived blended analysis product combining altimetry geostrophy and scatterometer Ekman drift).

### Canonical Transformation & Physics Mapping
We require U and V separated components.

**Current U Component**:
* **Source Variable**: `uo`
* **Canonical OceanEmbed Variable**: `current_u`
* **Physical Units**: `m/s` (meters per second).
* **Physical Conversion**: None.
* **ML Normalization**: Zero mean/unit variance later against training-split statistics only.

**Current V Component**:
* **Source Variable**: `vo`
* **Canonical OceanEmbed Variable**: `current_v`
* **Physical Units**: `m/s`
* **Physical Conversion**: None.
* **ML Normalization**: Zero mean/unit variance later against training-split statistics only.

## 8. Pipeline Readiness & Alignment Rules

To prevent silent corruption when combining SST, SSS, SSH, Winds, and Currents with GLORYS:

1. **Unit Conversions**: 
   - SST: Convert from `kelvin` to `degrees_Celsius` (`sst - 273.15`). 
   - SSS: PSU (no physical scaling). 
   - SSH (ADT): Meters (no physical scaling).
   - Wind U/V: `m s-1` (no physical scaling).
   - Current U/V: `m/s` (no physical scaling).
   *(Note: ML Normalization for all variables occurs later during dataset generation using strictly train-split statistics).*
2. **Temporal Alignment**: SST, SSS, SSH, GlobCurrent, and GLORYS natively possess exactly identical 31 daily timesteps (`2022-01-01T00:00:00` indexing). **ASCAT Wind is natively hourly (744 steps) and must explicitly compute the daily mean (`resample(time='1D').mean()`).**
3. **Depth Preservation & Extraction**: 
   - **SSS**: Native `depth=1`. Must be handled explicitly.
   - **GlobCurrent**: Native `depth=2` (`[0, 15]`). The adapter must explicitly extract `.isel(depth=0)` to discard the 15m layer.
   - **SST, SSH, Wind**: No depth dimension.
4. **Canonical Spatial Grid Definition**: 
   We must NOT rely on an implicit interpolation grid. All variables must be regridded explicitly to the canonical 0.25° grid:
   - **Latitude:** 5.0 to 30.0 in 0.25° increments.
   - **Longitude:** 45.0 to 105.0 in 0.25° increments.
5. **Spatial Interpolation**: SST (0.05°), SSS/SSH/Wind (0.125°), GlobCurrent (0.25° offset), and GLORYS (0.083°) all have fundamentally different native spatial coordinates. All variables will use explicit spatial interpolation (`xarray.interp`) to map exactly to the canonical grid before concatenation.

## 9. Mathematical Tensor & First Sample Milestone (SUCCESS)

A full canonical integration has been executed, producing the first mathematical tensor derived exclusively from Real Data (without synthetic substitutions, unit errors, or NaN corruption).

- **Input Tensor Contract**: `X` -> `(T=7, C=7, H=101, W=241)` 
- **Target Tensor Contract**: `Y` -> `(D=15, H=101, W=241)`
- **Target Mask**: Shape `(15, 101, 241)` explicitly governs supervised learning logic across depths.
- **Independent Channels**: Masks are strictly propagated per channel (`sst_mask`, `sss_mask`, etc.) ensuring no valid ocean observation is destroyed merely because an adjacent instrument swept a different swathe.
- **Forward Pass Status**: The canonical sample generated a finite `ThermoclineWeightedLoss`, validating the full stack geometry.

**Dataset Status**: `INTEGRATION_GATE_PASSED`

- **`scripts/preprocess.py`**: Updated to use `CMEMSAdapter`. It explicitly harmonizes the spatial grid (0.25°) and explicitly interpolates target depths to the 15 canonical `STANDARD_DEPTHS` *before* attempting validation.
- **`scripts/verify_alignment.py`**: A strict verification gate that checks physical ranges (sanity checks for NaNs, reasonable temperatures, salinities), exactly matches spatial bounds to 0.25°, checks the 15 canonical depths, and verifies temporal alignment.
- **`tests/test_single_sample.py`**: A pytest validation that loads a single processed sample and executes a forward pass through the `OceanEmbedModel` and `ThermoclineWeightedLoss`, verifying shapes and finite losses.

## 3. Data Alignment & Leakage Gates

| Gate | Status | Notes |
| :--- | :--- | :--- |
| **Spatial Alignment (0.25°)** | ⏳ PENDING | Awaiting real data. Script logic implemented. |
| **Temporal Alignment** | ⏳ PENDING | Awaiting real data. Script logic implemented. |
| **Depth Coordinates (15 Canonical)**| ⏳ PENDING | Awaiting real data. Interpolation implemented. |
| **Physical Sanity Checks** | ⏳ PENDING | Ranges defined in `verify_alignment.py`. |
| **Leakage Tests** | ⏳ PENDING | Awaiting real data for temporal window verification. |

## 4. Next Steps

1. Configure CMEMS credentials in the local environment.
2. Run `python scripts/download_data.py --dataset all` to fetch the smoke test data.
3. Run `python scripts/preprocess.py` (ensure you have a script to merge surface datasets if they download individually).
4. Run `python scripts/verify_alignment.py` to pass the Alignment Gate.
5. Run `pytest tests/test_single_sample.py` to achieve the **First Success Criterion**.
6. ONLY THEN proceed to baseline training.

**Milestone Status:** INCOMPLETE (Blocked on external data authentication). No scientific baseline training has begun.
