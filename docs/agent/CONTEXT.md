PROJECT: OceanEmbed
PROBLEM: SIH26066

OBJECTIVE: Surface satellite observations → subsurface temperature profile (15 depths, 0–1000m)

CURRENT PHASE: Phase 1 — Dataset Investigation

CURRENT MODEL: Baseline CNN (synthetic tested)

CURRENT DATA: Synthetic generated. Need real Copernicus Marine datasets.

CURRENT BEST METRICS: None on real data

CURRENT BLOCKER: Need CMEMS credentials

NEXT TASK: Test CMEMS connection and download a subset of data using download_data.py

IMPORTANT DECISIONS:
- DEC-001: CNN + GRU architecture
- DEC-002: Copernicus Marine as data source
- DEC-003: GLORYS12V1 as training target, Argo for validation
- DEC-004: Start with Bay of Bengal subset
- DEC-005: NumPy for samples, JSON for demo

DO NOT:
- Skip baseline model
- Use Transformer before CNN+GRU is working
- Download full global datasets
- Randomly split pixels from same day (leakage)
- Fabricate metrics or validation results
- Build frontend before ML pipeline works
- Hardcode experiment parameters in Python

- Phase 6 (ARGO Validation) completed. Next phase involves broader analysis, reports, or Model/Embeddings views.
