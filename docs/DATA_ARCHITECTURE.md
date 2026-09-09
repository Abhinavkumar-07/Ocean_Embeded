# DATA ARCHITECTURE

## Data Pipeline

```
Raw data → Format inspection → Variable selection → Coordinate normalization
→ Longitude normalization → Latitude ordering → Time normalization
→ Quality control → Missing-value handling → Spatial regridding
→ Temporal aggregation → Normalization → Aligned dataset
```

## Common Grid Specification

| Parameter | Value |
|:---|:---|
| Longitude range | 45.0°E → 105.0°E |
| Latitude range | 5.0°N → 30.0°N |
| Resolution | 0.25° × 0.25° |
| Grid size | 240 × 100 (lon × lat) |
| Temporal | Daily (midnight UTC) |
| Longitude convention | 0–360° |
| Latitude ordering | South → North |

## Dataset Adapter Interface

Every dataset adapter implements:

```python
class DatasetAdapter:
    def load(path) -> xr.Dataset
    def inspect() -> dict
    def get_provenance() -> dict  # Ensure provenance metadata is attached
    def select_variables(vars) -> xr.Dataset
    def normalize_coordinates() -> xr.Dataset
    def subset_region(lon_range, lat_range) -> xr.Dataset
    def regrid(target_grid) -> xr.Dataset
    def resample_time(freq) -> xr.Dataset
    def quality_control() -> QualityReport
    def export(path) -> None
```

## Missing Data Strategy

### SST Cloud Contamination
1. Create validity mask: `SST_valid_mask` (0/1)
2. Spatial interpolation (within-day neighbors)
3. Temporal interpolation (adjacent days)
4. Climatological fallback (monthly mean)
5. Model receives both `SST` and `SST_mask` as channels

### Other Variables
- SSH: Typically near-complete (altimetry)
- SSS: May have gaps, similar fallback strategy
- Currents/Wind: Model-derived, generally complete

## Normalization

Per-channel z-score normalization:
```
X_norm = (X - μ_train) / σ_train
```

**Critical**: μ and σ computed from TRAINING SET ONLY.

Statistics saved with checkpoint for inference reproducibility.

## Data Leakage Prevention

1. Temporal split: train dates < val dates < test dates
2. No spatial overlap in cross-region experiments
3. Normalization uses only training statistics
4. No future information in temporal interpolation
5. Target not included as input
6. Strict chronological split (e.g. Train: 2018-2021, Val: 2022, Test: 2023) to prevent autocorrelation leakage.
7. Support for disjoint spatial splits (e.g. Train on Arabian Sea, Test on Bay of Bengal).
