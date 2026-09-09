# VALIDATION

## Validation Strategy

### Level 1: Internal Validation (GLORYS holdout)
- Temporal holdout: last 20% of date range
- Metrics: RMSE, MAE, Bias, Correlation, R² (overall and per-depth)

### Level 2: Independent Validation (Argo floats)
- Argo profiles collocated with model predictions
- Compare at standard depths
- Provides truly independent assessment

### Level 3: Cross-Region Generalization
- Train on Arabian Sea → Test on Bay of Bengal
- Train on Bay of Bengal → Test on Arabian Sea
- Measures spatial generalization

## Metrics

### Overall
- RMSE (°C)
- MAE (°C)
- Bias (°C)
- Correlation (Pearson r)
- R²

### Per-Depth
- RMSE at each of 15 depths

### Per-Band
- Surface (0–50m) RMSE
- Thermocline (75–300m) RMSE
- Deep (500–1000m) RMSE

## Physical Sanity Checks

- Temperature range: -2°C to 35°C
- No extreme spatial discontinuities (>5°C between adjacent cells)
- No extreme temporal jumps (>3°C between consecutive days at same depth)
- Temperature profile plausibility (not enforced as hard constraint, but flagged)

## Figures to Generate

1. RMSE-by-depth profile
2. Predicted vs observed scatter (per depth band)
3. Spatial RMSE map
4. Temperature profile: prediction + truth + uncertainty
5. Temporal RMSE evolution
6. Cross-region comparison bar chart

## Validation Methodology & Policy

- **Depth Interpolation Policy**: ARGO profiles are strictly interpolated to the exact 15 standard model depths (0m to 1000m).
- **Matching Strategy**: Floats are matched by region, reconstruction date, and a temporal window of +/- 3 days.
- **Convention**: Error is always calculated as predictedTemperature - observedTemperature.
- **Metrics**: RMSE, MAE, Bias, Correlation, and R-squared are calculated from strictly paired observation/prediction arrays.
- **Demo Mode**: If the live backend is unavailable, the application falls back to a deterministic synthetic dataset sampled directly from the current reconstruction result with added deterministic Gaussian noise, ensuring reproducibility for demonstration purposes without claiming real scientific validation.
- **Scientific Distinction**: GLORYS is the training target; ARGO is the independent validation observation.
