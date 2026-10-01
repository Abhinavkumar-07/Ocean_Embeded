# OceanEmbed — AI for a Deeper, Healthier Ocean
**Smart India Hackathon (SIH) 26066 Proof-of-Concept**

![OceanEmbed Dashboard](https://img.shields.io/badge/Status-Prototype_Active-success) ![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)

**OceanEmbed** is a Satellite Embedding-Based Deep Learning Framework designed to reconstruct 3D subsurface ocean temperature profiles using only 2D surface satellite observations.

## The Problem
While satellites provide immense data about the ocean surface, the subsurface layers—critical for climate modeling, fisheries, and naval sonar operations—are invisible from space. Current in-situ measurements (like ARGO floats) are sparse, and physics-based numerical models are computationally expensive.

## The Solution
We treat the ocean's surface dynamics (Temperature, Salinity, Sea Surface Height, Winds, and Currents) as a physical fingerprint of the depths below. By feeding a 7-day rolling history of these 7 multi-variate channels into our **CNN-GRU Architecture**, we can instantaneously reconstruct the temperature down to 1000m.

### Key Innovations
* **Multi-variate Fusion:** We don't just use SST; we embed 7 variables into a unified spatial latent space.
* **Thermocline-Weighted Loss:** A custom PyTorch loss function that forces the neural network to accurately predict the sharp temperature drop in the thermocline (50m-200m depth), which standard models usually smooth out.
* **Missing Data Resilience:** Our custom `MaskedMSELoss` handles satellite cloud-cover natively during training.

---

## System Architecture

### 1. The ML Pipeline (`/notebooks`, `/src/models`)
- PyTorch based CNN-GRU sequence-to-sequence model.
- Data harmonization scripts converting raw NetCDF files into unified spatial grids.

### 2. The Backend API (`/backend`)
- Built with **FastAPI**.
- Loads the `.pth` model weights.
- Exposes endpoints `/api/v1/inference`, `/api/v1/data/surface`, and `/api/v1/profile`.

### 3. The Dashboard UI (`/frontend`)
- Built with **React** and **Vite**.
- Features an interactive **Leaflet Map** of the Indian Ocean.
- Uses **CSS 3D Transforms** to visualize the 3D depth stack.
- Uses **Recharts** to plot vertical profiles against ARGO ground truth.

---

## Quickstart

### Prerequisites
* Python 3.10+
* Node.js 18+

### Running the Backend
```bash
# Navigate to project root
cd Ocean_embeded
# Activate virtual environment
venv\Scripts\activate
# Start FastAPI
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Running the Frontend
```bash
cd Ocean_embeded/frontend
# Install dependencies
npm install
# Start Vite development server
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## Deploying to Google Cloud
See [docs/DEPLOY_GCP.md](docs/DEPLOY_GCP.md): a single Cloud Run container serves both the API and the dashboard.

## Documentation
* See [Pitch Deck Outline](docs/sih_pitch_deck.md)
* See [Model Card](docs/model_card.md)

---
*Built for SIH 26066*
