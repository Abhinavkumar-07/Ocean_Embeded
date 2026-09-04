# API ARCHITECTURE

## Base URL
```
http://localhost:8000
```

## Endpoints

### GET /health
Health check.

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "mode": "demo",
  "version": "0.1.0"
}
```

### GET /metadata
Model and domain metadata.

Response:
```json
{
  "model_name": "OceanEmbed-v1",
  "architecture": "CNN+GRU",
  "embedding_dim": 128,
  "temporal_window": 7,
  "depths": [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000],
  "region": {
    "lat_min": 5.0,
    "lat_max": 30.0,
    "lon_min": 45.0,
    "lon_max": 105.0
  },
  "input_variables": ["SST", "SSS", "SSH", "current_u", "current_v", "wind_u", "wind_v"],
  "training_date_range": ["2020-01-01", "2020-12-31"],
  "mode": "demo"
}
```

### GET /grid
Grid coordinates for the domain.

Response:
```json
{
  "latitudes": [5.0, 5.25, 5.5, ...],
  "longitudes": [45.0, 45.25, 45.5, ...],
  "depths": [0, 5, 10, ...]
}
```

### GET /prediction
Spatial prediction at a given depth and date.

Parameters:
- `date` (required): YYYY-MM-DD
- `depth` (required): depth in meters
- `lat_min`, `lat_max`, `lon_min`, `lon_max` (optional): subset region

Response:
```json
{
  "date": "2020-06-15",
  "depth": 100,
  "latitudes": [...],
  "longitudes": [...],
  "temperature": [[...]],
  "uncertainty": [[...]],
  "data_source": "model_inference"
}
```

### GET /profile
Temperature profile at a point.

Parameters:
- `latitude` (required): float
- `longitude` (required): float
- `date` (required): YYYY-MM-DD

Response:
```json
{
  "latitude": 15.25,
  "longitude": 88.50,
  "date": "2020-06-15",
  "depths": [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000],
  "temperature": [29.1, 29.0, 28.9, ...],
  "lower": [28.5, 28.4, 28.3, ...],
  "upper": [29.7, 29.6, 29.5, ...],
  "data_source": "model_inference"
}
```

### GET /metrics
Model evaluation metrics.

Response:
```json
{
  "overall": {
    "rmse": 0.85,
    "mae": 0.62,
    "bias": -0.03,
    "correlation": 0.97,
    "r2": 0.94
  },
  "per_depth": {
    "0": {"rmse": 0.42, "mae": 0.31},
    "100": {"rmse": 1.12, "mae": 0.89}
  },
  "bands": {
    "surface": {"rmse": 0.45},
    "thermocline": {"rmse": 1.05},
    "deep": {"rmse": 0.72}
  },
  "experiment_id": "exp_001",
  "model_name": "CNN+GRU"
}
```

### GET /data-quality
Satellite data coverage information.

Response:
```json
{
  "date": "2020-06-15",
  "coverage": {
    "SST": 87.2,
    "SSS": 94.1,
    "SSH": 98.5,
    "current_u": 95.0,
    "current_v": 95.0,
    "wind_u": 99.1,
    "wind_v": 99.1
  }
}
```

## Error Responses
```json
{
  "detail": "Prediction not available for the requested date",
  "error_code": "PREDICTION_UNAVAILABLE"
}
```

Status codes: 400 (bad request), 404 (not found), 503 (model unavailable)

## Demo Mode
When `APP_MODE=demo`, all endpoints serve pre-computed data from `data/samples/demo/`.
Response includes `"data_source": "demo_precomputed"`.
