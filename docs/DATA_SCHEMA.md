# DATA SCHEMA

## Coordinate Conventions

| Dimension | Canonical Name | Range / Convention | Units |
|:---|:---|:---|:---|
| Longitude | `lon` | 45.0 → 105.0 (Configurable mapping: e.g. -180/180 or 0/360) | degrees East |
| Latitude | `lat` | 5.0 → 30.0 (Strict South → North ordering) | degrees North |
| Time | `time` | datetime64[ns] (Strict monotonic increasing) | UTC midnight |
| Depth | `depth` | 0 → 1000 (Strict shallow → deep ordering) | meters |

## Grid Dimensions

```
lon: 241 points (45.00, 45.25, ..., 105.00)
lat: 101 points (5.00, 5.25, ..., 30.00)
depth: 15 levels
time: variable (daily)
```

Note: H=101, W=241 in tensor notation.

## Standard Depths

```python
STANDARD_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000]
```

## Input Channels

### A. Surface Input Dataset Schema
Must contain the following canonical variables, mapped from their provider-specific equivalents:
```python
INPUT_VARIABLES = [
    'sst',        # Sea Surface Temperature (°C)
    'sss',        # Sea Surface Salinity (PSU)
    'ssh',        # Sea Surface Height / Anomaly (m)
    'current_u',  # Surface current eastward (m/s)
    'current_v',  # Surface current northward (m/s)
    'wind_u',     # Surface wind eastward (m/s)
    'wind_v',     # Surface wind northward (m/s)
]
```

### B. Target Subsurface Dataset Schema
```python
TARGET_VARIABLES = [
    'target_temp', # Subsurface Temperature at specified depths (°C)
]
```

### C. QC and Missing Data Masks
Missing values (`NaN`) must NEVER be silently converted to 0 during adapter load. They are preserved in the xarray Dataset, and an explicit QC mask is maintained.
```python
MASK_VARIABLES = [
    '<var>_mask', # 1 = Valid, 0 = Missing/Rejected for any <var>
]
```

## Provenance Schema
Every DatasetAdapter MUST expose a `.get_provenance()` dictionary matching this schema:
```json
{
  "dataset_name": "string",
  "provider": "string",
  "product_id": "string",
  "dataset_id": "string",
  "variable_names_original": ["string"],
  "variable_names_canonical": ["string"],
  "source_url": "string",
  "download_timestamp": "string (ISO-8601)",
  "spatial_extent": {"lon_min": 0, "lon_max": 0, "lat_min": 0, "lat_max": 0},
  "temporal_extent": {"start": "string", "end": "string"},
  "resolution": "string",
  "units": {"canonical_var": "string"},
  "coordinate_conventions": "string",
  "depth_convention": "string",
  "processing_version": "string",
  "checksum": "string (optional)"
}
```
If metadata is unavailable, represent it as `"unavailable"` rather than fabricating.

## Tensor Shapes

### Training Input
```
X: (B, T, C, H, W)
   B = batch size
   T = temporal window (1, 3, 5, or 7)
   C = 7 (or 8 with SST mask)
   H = 101 (latitude)
   W = 241 (longitude)
```

### Training Target
```
Y: (B, D, H, W)
   D = 15 depth levels
```

### Mask
```
M: (B, T, 1, H, W)
   Valid observation mask (0 or 1)
```

### Model Output
```
Y_pred: (B, D, H, W)      # temperature predictions
Y_std:  (B, D, H, W)      # uncertainty (MC Dropout)
```

## Normalization Statistics

Stored as:
```python
{
    'mean': np.array([...]),   # shape (C,)
    'std': np.array([...]),    # shape (C,)
    'target_mean': np.array([...]),  # shape (D,)
    'target_std': np.array([...]),   # shape (D,)
}
```

Computed from TRAINING SET ONLY.
Saved alongside checkpoints.

## Sample File Format

### Processed Samples (NumPy)
```
data/samples/
├── train/
│   ├── sample_00000.npz
│   │   ├── surface: (T, C, H, W)
│   │   ├── target: (D, H, W)
│   │   ├── mask: (T, 1, H, W)
│   │   ├── date: str (center date)
│   │   └── metadata: dict
│   ├── sample_00001.npz
│   └── ...
├── val/
└── test/
```

### Demo Predictions (JSON)
```
data/samples/demo/
├── predictions.json
├── profiles.json
├── metrics.json
└── quality.json
```

## Validation Types
Added ValidationPoint and ValidationResult with full support for depth metrics, band metrics, and metadata.
