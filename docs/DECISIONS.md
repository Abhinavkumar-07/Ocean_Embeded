# DECISIONS

## DEC-001 — Use CNN + GRU as initial temporal architecture

**Date**: 2026-09-04  
**Status**: Accepted

**Decision**: Use CNN spatial encoding followed by GRU temporal modeling as the primary architecture.

**Reason**: Provides spatial + temporal modeling while remaining computationally manageable. Recent literature (2024–2025) confirms CNN+RNN hybrids remain competitive for subsurface temperature reconstruction.

**Alternatives considered**:
- CNN only (no temporal) — used as baseline for comparison
- Transformer — too parameter-heavy for initial prototype with limited compute
- CNN + LSTM — GRU is simpler, fewer parameters, comparable performance

**Consequences**: Must implement baseline CNN separately for ablation comparison.

---

## DEC-002 — Use Copernicus Marine as primary data source

**Date**: 2026-09-04  
**Status**: Accepted

**Decision**: Use Copernicus Marine Service (CMEMS) for all satellite and reanalysis data.

**Reason**: Single provider with consistent API, free access, covers all required variables. GLORYS12V1 provides the subsurface temperature target.

**Alternatives considered**:
- INCOIS data portal — regional but less programmatic access
- Multiple providers — complexity of harmonizing different APIs
- ERA5 — atmospheric reanalysis, not ocean-focused

**Consequences**: Requires CMEMS account. If unavailable, use synthetic data for pipeline validation.

---

## DEC-003 — Use GLORYS12V1 as training target (not Argo)

**Date**: 2026-09-04  
**Status**: Accepted

**Decision**: Train against GLORYS12V1 reanalysis subsurface temperature. Use Argo floats only for independent validation.

**Reason**: GLORYS provides gridded, gap-free data suitable for supervised learning. Argo provides sparse point observations better suited for validation.

**Alternatives considered**:
- Train directly on Argo profiles — sparse, irregular spacing makes CNN training difficult
- Use both — premature complexity

**Consequences**: Model learns reanalysis patterns. Argo comparison provides independent scientific validation.

---

## DEC-004 — Start with Bay of Bengal subset

**Date**: 2026-09-04  
**Status**: Accepted

**Decision**: Begin development with Bay of Bengal (80°E–95°E, 5°N–20°N) for 3 months (2020 Q1).

**Reason**: Manageable data volume. Active thermocline dynamics. Later expand to full domain.

**Consequences**: Arabian Sea used for cross-region generalization test.

---

## DEC-005 — Model output storage format

**Date**: 2026-09-04  
**Status**: Accepted

**Decision**: Use NumPy (.npy) for training samples and JSON for demo predictions.

**Reason**: NumPy is fast for PyTorch DataLoader. JSON is easily served via API for demo.

**Alternatives considered**:
- NetCDF — better for large-scale, overkill for prototype
- Zarr — cloud-native, unnecessary at this stage

**Consequences**: May migrate to NetCDF/Zarr if data scale grows.
