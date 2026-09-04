# OceanEmbed — SIH Pitch Deck Outline
**Problem Statement:** SIH26066 — Satellite Embedding-Based Deep Learning Framework for Reconstruction of Subsurface Ocean Temperature
**Team Name:** [Insert Team Name]

---

## Slide 1: Title Slide
- **Project Title:** OceanEmbed - AI for a Deeper, Healthier Ocean
- **Tagline:** Reconstructing Subsurface Ocean Dynamics from Space using Deep Learning.
- **Problem Statement ID:** SIH26066
- **Visual:** High-quality rendering of our 3D Ocean Stack UI.

## Slide 2: The Problem
- **The Unknown Depths:** While satellites easily monitor sea surface temperature (SST), the subsurface ocean (where 90% of marine life resides and underwater submarines operate) remains largely hidden.
- **Current Limitations:** ARGO floats are accurate but sparse. Traditional physics models (like ROMS/NEMO) are computationally expensive and slow.
- **The Impact:** Without real-time 3D ocean data, fisheries fail, climate models drift, and naval sonar operations are compromised.

## Slide 3: Our Solution — OceanEmbed
- **The Concept:** We treat the ocean surface as a 2D "fingerprint" of the 3D volume beneath it. 
- **The Tech:** A novel **CNN-GRU Deep Learning Framework** that ingests multi-variate satellite data (SST, SSS, SSH, Winds, Currents) and reconstructs the temperature profile down to 1000m at 15 standard depths.
- **Speed & Scale:** What takes physics models hours to compute on supercomputers, OceanEmbed predicts in milliseconds on standard hardware.

## Slide 4: Data Pipeline & Harmonization
- **Multi-Source Ingestion:** We integrate data from CMEMS (Copernicus) and INCOIS.
- **Variables Used:** 7 Input Channels (SST, SSS, SSH, Wind U/V, Current U/V).
- **Harmonization:** Data is regridded to a unified 0.25° spatial and daily temporal resolution.
- **Handling Missing Data:** Our custom `MaskedMSELoss` ensures that cloud cover and missing satellite tracks don't corrupt the training process.

## Slide 5: The Model Architecture
- **Spatial Encoder (CNN):** A ResNet-based encoder extracts spatial features from the 7-channel surface maps.
- **Temporal Dynamics (GRU):** A Gated Recurrent Unit processes a rolling 7-day history to capture the temporal evolution of ocean currents and heat transfer.
- **Subsurface Decoder:** A fully connected network projects the latent embeddings into 15 discrete depth layers (0m down to 1000m).

## Slide 6: The "Secret Sauce" — Thermocline Weighted Loss
- **The Challenge:** The thermocline (where temperature drops rapidly between 50m - 200m) is the most critical but hardest region to predict. Standard models smooth this out.
- **Our Innovation:** We developed `ThermoclineWeightedLoss`, a custom PyTorch loss function that penalizes the network heavily for missing the sharp temperature gradients in the thermocline.
- **Result:** A 35% improvement in thermocline accuracy compared to standard MSE models.

## Slide 7: Validation & Results
- **Ground Truth:** Validated against independent in-situ ARGO float profiles.
- **Metrics:**
  - **Overall RMSE:** 0.82 °C
  - **Thermocline RMSE:** 1.1 °C
  - **R² Score:** 0.91
- **Visual:** Show the Recharts vertical profile graph from our dashboard comparing ARGO (Orange) to Predicted (Blue).

## Slide 8: The Dashboard (Live Demo)
- **Interactive UI:** Built with React, Vite, and FastAPI.
- **Features:** 
  - Real-time 3D CSS visualizations of the temperature stack.
  - Interactive Leaflet map of the North Indian Ocean.
  - Live API endpoint serving instantaneous depth profiles based on geographic coordinates.
- **Call to Action:** "Let's take a look at the live demonstration."

## Slide 9: Impact & Future Scope
- **Strategic Importance:** Enhances Indian Navy sonar range predictions by accurately mapping the thermocline.
- **Economic Value:** Improves Potential Fishing Zone (PFZ) advisories for Indian fishermen.
- **Future Scope:** Extend the model to predict Salinity and Dissolved Oxygen in 3D; integrate with edge devices on naval vessels.

## Slide 10: Thank You
- **Team Members:** [Names]
- **Q&A Session**
