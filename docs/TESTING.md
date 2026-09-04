# TESTING

## Test Structure

```
tests/
├── data/           # Data pipeline tests
│   ├── test_adapters.py
│   ├── test_harmonizer.py
│   ├── test_quality.py
│   ├── test_missing_data.py
│   ├── test_dataset.py
│   └── test_leakage.py
├── ml/             # ML model tests
│   ├── test_spatial_encoder.py
│   ├── test_temporal_encoder.py
│   ├── test_decoder.py
│   ├── test_model.py
│   ├── test_losses.py
│   └── test_metrics.py
├── api/            # API tests
│   ├── test_health.py
│   ├── test_prediction.py
│   └── test_profile.py
└── integration/    # End-to-end tests
    └── test_pipeline.py
```

## Running Tests

```bash
# All tests
pytest tests/ -v

# Specific category
pytest tests/data/ -v
pytest tests/ml/ -v
pytest tests/api/ -v

# With coverage
pytest tests/ --cov=ml --cov=backend -v
```

## Data Leakage Tests

`tests/data/test_leakage.py` explicitly verifies:
1. No test dates appear in training set
2. Normalization stats computed from training only
3. Spatial test region not in training (for cross-region)
4. No future information in temporal interpolation
5. Target data not included as model input

## Model Shape Tests

Every model test verifies:
- Output shape matches `(B, D, H, W)` where D=15
- No NaN in output
- Output within physical range (-5°C to 35°C)
- Gradient flows through all parameters

## API Tests

Use FastAPI TestClient:
- Health endpoint returns 200
- Prediction returns correct schema
- Invalid coordinates return 400
- Missing dates return 404
