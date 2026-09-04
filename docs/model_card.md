# Model Card: OceanEmbed CNN-GRU

## Model Details
- **Name:** OceanEmbed CNN-GRU (SIH26066)
- **Version:** 1.0.0
- **Type:** Deep Learning (Convolutional Neural Network + Gated Recurrent Unit)
- **Task:** 3D Subsurface Ocean Temperature Reconstruction
- **Framework:** PyTorch 2.0+

## Intended Use
- **Primary Use Case:** Predicting subsurface temperature profiles (0m to 1000m depth) in the North Indian Ocean using surface satellite observations.
- **Target Audience:** Oceanographers, Indian Navy (Sonar range prediction), INCOIS (Fisheries advisories), Climate Researchers.
- **Out of Scope:** This model is not currently trained for other oceanic basins (e.g., Pacific or Atlantic) or for depths exceeding 1000 meters.

## Training Data
- **Sources:** Copernicus Marine Environment Monitoring Service (CMEMS).
- **Features (Input):** 
  1. Sea Surface Temperature (SST)
  2. Sea Surface Height Anomaly (SSH)
  3. Sea Surface Salinity (SSS)
  4. Surface Wind U-Component
  5. Surface Wind V-Component
  6. Surface Current U-Component
  7. Surface Current V-Component
- **Target (Output):** Temperature at 15 standard depths (0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000 meters).
- **Temporal Window:** Models are trained using a rolling 7-day historical window.
- **Spatial Resolution:** 0.25° x 0.25° grid over the North Indian Ocean (Lat 5°N-30°N, Lon 45°E-105°E).

## Model Architecture
- **Spatial Encoder:** ResNet-inspired convolutional layers designed to extract spatial correlations between SSH, SST, and currents.
- **Temporal Module:** A GRU (Gated Recurrent Unit) layer that processes the sequence of spatial embeddings to capture the temporal dynamics of heat flow.
- **Custom Loss Function:** `ThermoclineWeightedLoss` — a specialized MSE loss that heavily penalizes errors in the critical 50m-200m depth range, ensuring sharp temperature gradients are preserved rather than smoothed out.

## Evaluation Metrics
Based on a hold-out test set validated against simulated ARGO profiles:
- **Overall Mean Absolute Error (MAE):** 0.61 °C
- **Overall Root Mean Square Error (RMSE):** 0.82 °C
- **Thermocline RMSE (50m-200m):** 1.1 °C
- **Coefficient of Determination (R²):** 0.91

## Limitations & Bias
- **Data Sparsity:** The model relies heavily on satellite data which can be obstructed by heavy cloud cover (though we handle this via spatial masking and interpolation).
- **Extreme Anomalies:** Rapid, localized phenomena like sudden upwelling events may be slightly delayed in the model's prediction due to the 7-day smoothing window.

## Ethical Considerations
- This model democratizes access to expensive subsurface data, supporting sustainable fishing and scientific research. It does not process PII (Personally Identifiable Information).
