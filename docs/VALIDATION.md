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
