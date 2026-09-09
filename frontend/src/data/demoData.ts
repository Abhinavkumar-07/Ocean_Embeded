// ============================================================
// OceanEmbed — Deterministic Demo Data Generator
// ============================================================
// All data generated here is SYNTHETIC for UI demonstration only.
// It does NOT represent real satellite or ARGO observations.
// ============================================================

import type {
  OceanGrid, TemperatureProfile, ARGOFloat, ARGOProfile,
  ValidationMetrics, ReconstructionResult, ModelMetadata,
  DataQuality, Region, DisplayVariable, ValidationPoint, ValidationResult
} from '../types/ocean';
import { STANDARD_DEPTHS, REGION_BOUNDS } from '../types/ocean';

// --- Seeded PRNG (deterministic) ---

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function seededRandom(seed: number): () => number {
  let s = seed ^ 0xdeadbeef;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 1597334677);
    s = Math.imul(s ^ (s >>> 15), 3812015801);
    return ((s ^ (s >>> 13)) >>> 0) / 4294967296;
  };
}

let activeRng = seededRandom(42);

export function setDemoSeed(seedStr: string) {
  activeRng = seededRandom(hashString(seedStr));
}

export function gaussianNoise(amplitude: number = 1, customRng?: () => number): number {
  const r = customRng || activeRng;
  const u1 = r();
  const u2 = r();
  return amplitude * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
}

// --- Grid dimensions ---
// Full NIO grid at 0.25°: lat 5–30 = 101 points, lon 45–105 = 241 points
// For demo UI we use a downsampled grid for performance
const DEMO_LAT_POINTS = 51;   // ~0.5° resolution
const DEMO_LON_POINTS = 121;
const LAT_MIN = 5;
const LAT_MAX = 30;
const LON_MIN = 45;
const LON_MAX = 105;

export function latAtIndex(i: number): number {
  return LAT_MIN + (i / (DEMO_LAT_POINTS - 1)) * (LAT_MAX - LAT_MIN);
}
export function lonAtIndex(j: number): number {
  return LON_MIN + (j / (DEMO_LON_POINTS - 1)) * (LON_MAX - LON_MIN);
}

// Remove latToIndex and lonToIndex as they are unused

// --- Land mask (simplified) ---
function isLand(lat: number, lon: number): boolean {
  // Very rough Indian subcontinent mask
  if (lat > 8 && lat < 28 && lon > 72 && lon < 78 && lat > (lon - 64)) return true;
  if (lat > 20 && lon > 55 && lon < 72) return true; // Arabian peninsula
  if (lat > 23 && lon > 88 && lon < 98) return true; // Myanmar
  if (lat > 6 && lat < 10 && lon > 98) return true; // Malay peninsula
  return false;
}

// ============================================================
// Surface Variable Generators
// ============================================================

export function generateSurfaceGrid(variable: DisplayVariable, date: string, region: Region): OceanGrid {
  const bounds = REGION_BOUNDS[region];
  const dayOfYear = getDayOfYear(date);
  const grid: OceanGrid = [];

  for (let i = 0; i < DEMO_LAT_POINTS; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < DEMO_LON_POINTS; j++) {
      const lat = latAtIndex(i);
      const lon = lonAtIndex(j);

      // Check if within region bounds
      if (lat < bounds.latMin || lat > bounds.latMax || lon < bounds.lonMin || lon > bounds.lonMax) {
        row.push(null);
        continue;
      }

      if (isLand(lat, lon)) {
        row.push(null);
        continue;
      }

      row.push(generatePointValue(variable, lat, lon, dayOfYear));
    }
    grid.push(row);
  }
  return grid;
}

function generatePointValue(variable: DisplayVariable, lat: number, lon: number, dayOfYear: number): number {
  const seasonal = Math.sin((dayOfYear / 365) * 2 * Math.PI);

  switch (variable) {
    case 'sst': {
      // SST: warmer at equator, cooler at higher latitudes, seasonal modulation
      const base = 30 - (lat - 5) * 0.35;
      const lonEffect = Math.sin((lon - 45) * 0.05) * 0.5;
      const seasonalEffect = seasonal * 1.5;
      return base + lonEffect + seasonalEffect + gaussianNoise(0.3);
    }
    case 'sss': {
      // SSS: higher in Arabian Sea, lower in Bay of Bengal (river runoff)
      const base = 35;
      const lonEffect = lon < 78 ? 0.5 : -1.0; // Arabian vs BoB
      const latEffect = (lat - 15) * 0.05;
      return base + lonEffect + latEffect + seasonal * 0.3 + gaussianNoise(0.15);
    }
    case 'ssh': {
      // SSH: small anomalies
      const base = 0;
      const eddyEffect = Math.sin(lat * 0.8) * Math.cos(lon * 0.5) * 0.15;
      return base + eddyEffect + seasonal * 0.05 + gaussianNoise(0.03);
    }
    case 'current': {
      // Current speed
      const base = 0.3;
      const equatorialJet = lat < 10 ? 0.5 : 0;
      return base + equatorialJet + Math.abs(seasonal * 0.2) + Math.abs(gaussianNoise(0.1));
    }
    case 'wind': {
      // Wind speed
      const base = 5;
      const monsoon = seasonal > 0 ? seasonal * 4 : Math.abs(seasonal) * 2;
      return base + monsoon + Math.abs(gaussianNoise(0.5));
    }
    default:
      return 0;
  }
}

function getDayOfYear(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

// ============================================================
// Subsurface Temperature
// ============================================================

export function generateSubsurfaceTemperature(lat: number, lon: number, date: string): number[] {
  const dayOfYear = getDayOfYear(date);
  const seasonal = Math.sin((dayOfYear / 365) * 2 * Math.PI);
  const surfaceTemp = 30 - (lat - 5) * 0.35 + (lon * 0.001) + seasonal * 1.5;

  return STANDARD_DEPTHS.map((depth) => {
    if (depth === 0) return surfaceTemp + gaussianNoise(0.2);

    // Exponential decay with a thermocline around 50-150m
    const thermoclineCenter = 100 + seasonal * 20;
    const thermoclineWidth = 60;
    const decay = 1 / (1 + Math.exp((depth - thermoclineCenter) / thermoclineWidth));
    const deepTemp = 4 + (lat - 5) * 0.08;
    const temp = deepTemp + (surfaceTemp - deepTemp) * decay;
    return temp + gaussianNoise(0.15);
  });
}

export function generateReconstructionGrid(depthIndex: number, date: string, region: Region): OceanGrid {
  const bounds = REGION_BOUNDS[region];
  const grid: OceanGrid = [];

  for (let i = 0; i < DEMO_LAT_POINTS; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < DEMO_LON_POINTS; j++) {
      const lat = latAtIndex(i);
      const lon = lonAtIndex(j);

      if (lat < bounds.latMin || lat > bounds.latMax || lon < bounds.lonMin || lon > bounds.lonMax) {
        row.push(null);
        continue;
      }
      if (isLand(lat, lon)) {
        row.push(null);
        continue;
      }

      const profile = generateSubsurfaceTemperature(lat, lon, date);
      row.push(profile[depthIndex]);
    }
    grid.push(row);
  }
  return grid;
}

export function generateFullReconstruction(
  date: string, 
  region: Region, 
  modelType: import('../types/ocean').ModelType,
  temporalWindow: number,
  inputVariables: import('../types/ocean').DisplayVariable[]
): ReconstructionResult {
  const seedString = `${date}_${region}_${modelType}_${temporalWindow}_${inputVariables.sort().join(',')}`;
  setDemoSeed(seedString);

  const data: OceanGrid[] = STANDARD_DEPTHS.map((_, idx) =>
    generateReconstructionGrid(idx, date, region)
  );
  return {
    data,
    depths: [...STANDARD_DEPTHS],
    date,
    region,
    spatialResolution: '0.25° × 0.25°',
    model: modelType,
    metadata: DEMO_MODELS.find(m => m.type === modelType) || DEMO_MODELS[0],
    temporalWindow,
    inputVariables,
    mode: 'demo',
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Temperature Profile
// ============================================================

export function generateProfile(lat: number, lon: number, date: string): TemperatureProfile {
  const predicted = generateSubsurfaceTemperature(lat, lon, date);
  // "Observed" = predicted + small perturbation (simulating ARGO ground truth)
  const observed = predicted.map((t, i) => t + gaussianNoise(0.4) * (1 + i * 0.02));

  const S = 35; // salinity for Mackenzie equation
  const soundSpeed = STANDARD_DEPTHS.map((d, i) => {
    const T = predicted[i];
    return 1448.96 + 4.591 * T - 0.05304 * T * T + 2.374e-4 * T * T * T
      + 1.34 * (S - 35) + 0.0163 * d + 1.675e-7 * d * d
      - 0.01025 * T * (S - 35) - 7.139e-13 * T * d * d * d;
  });

  return {
    lat, lon, date,
    depths: [...STANDARD_DEPTHS],
    predicted,
    observed,
    soundSpeed: soundSpeed.map(s => Math.round(s * 100) / 100),
    source: 'model',
  };
}

// ============================================================
// ARGO Floats
// ============================================================

export const DEMO_ARGO_FLOATS: ARGOFloat[] = [
  { id: '2901323', lat: 15.6, lon: 88.4, date: '2020-02-12', numProfiles: 42, status: 'active' },
  { id: '2901456', lat: 12.3, lon: 83.7, date: '2020-02-10', numProfiles: 38, status: 'active' },
  { id: '2901789', lat: 18.1, lon: 90.2, date: '2020-02-14', numProfiles: 31, status: 'active' },
  { id: '2902012', lat: 10.5, lon: 72.8, date: '2020-01-28', numProfiles: 55, status: 'active' },
  { id: '2902234', lat: 14.8, lon: 65.2, date: '2020-02-05', numProfiles: 47, status: 'active' },
  { id: '2902567', lat: 8.2,  lon: 78.5, date: '2020-02-11', numProfiles: 29, status: 'active' },
  { id: '2902890', lat: 20.1, lon: 67.3, date: '2020-01-20', numProfiles: 36, status: 'inactive' },
  { id: '2903123', lat: 7.4,  lon: 88.9, date: '2020-02-08', numProfiles: 22, status: 'active' },
];

export function generateARGOProfile(float: ARGOFloat): ARGOProfile {
  const predicted = generateSubsurfaceTemperature(float.lat, float.lon, float.date);
  const argoTemp = predicted.map((t, i) => t + gaussianNoise(0.5) * (1 + i * 0.015));

  const errors = predicted.map((p, i) => p - argoTemp[i]);
  const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;
  const bias = errors.reduce((s, e) => s + e, 0) / errors.length;

  const meanP = predicted.reduce((s, v) => s + v, 0) / predicted.length;
  const meanA = argoTemp.reduce((s, v) => s + v, 0) / argoTemp.length;
  const cov = predicted.reduce((s, p, i) => s + (p - meanP) * (argoTemp[i] - meanA), 0) / predicted.length;
  const stdP = Math.sqrt(predicted.reduce((s, p) => s + (p - meanP) ** 2, 0) / predicted.length);
  const stdA = Math.sqrt(argoTemp.reduce((s, a) => s + (a - meanA) ** 2, 0) / argoTemp.length);
  const correlation = cov / ((stdP * stdA) || 1);

  const ssTot = argoTemp.reduce((s, a) => s + (a - meanA) ** 2, 0);
  const ssRes = errors.reduce((s, e) => s + e * e, 0);
  const r2 = 1 - ssRes / (ssTot || 1);

  return {
    floatId: float.id,
    lat: float.lat,
    lon: float.lon,
    date: float.date,
    depths: [...STANDARD_DEPTHS],
    argoTemp,
    predictedTemp: predicted,
    rmse: Math.round(rmse * 1000) / 1000,
    mae: Math.round(mae * 1000) / 1000,
    bias: Math.round(bias * 1000) / 1000,
    correlation: Math.round(correlation * 1000) / 1000,
    r2: Math.round(r2 * 1000) / 1000,
  };
}

export function generateValidationMetrics(): ValidationMetrics {
  const profiles = DEMO_ARGO_FLOATS.map(generateARGOProfile);
  const allRMSE = profiles.map(p => p.rmse);
  const overallRMSE = allRMSE.reduce((s, v) => s + v, 0) / allRMSE.length;

  const depthWiseRMSE = STANDARD_DEPTHS.map((depth, idx) => {
    const errors = profiles.map(p => p.predictedTemp[idx] - p.argoTemp[idx]);
    const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
    return { depth, rmse: Math.round(rmse * 1000) / 1000 };
  });

  return {
    overallRMSE: Math.round(overallRMSE * 1000) / 1000,
    overallMAE: Math.round(overallRMSE * 0.78 * 1000) / 1000,
    overallBias: Math.round((overallRMSE * 0.1) * 1000) / 1000,
    overallCorrelation: Math.round((0.94 + gaussianNoise(0.01, seededRandom(99))) * 1000) / 1000,
    overallR2: Math.round((0.91 + gaussianNoise(0.01, seededRandom(100))) * 1000) / 1000,
    depthWiseRMSE,
    totalProfiles: DEMO_ARGO_FLOATS.length,
    matchedProfiles: DEMO_ARGO_FLOATS.filter(f => f.status === 'active').length,
    evaluationPeriod: 'Jan 2020 – Mar 2020',
    trainingTarget: 'GLORYS Global Ocean Reanalysis',
    validationSource: 'Gridded ARGO / INCOIS LAS',
  };
}

// ------------------------------------------------------------
// NEW: Phase 6 Deterministic Validation Generator
// ------------------------------------------------------------
export function generateValidationResult(reconstruction: ReconstructionResult): ValidationResult {
  // Create a local PRNG seeded by the reconstruction details for absolute determinism
  const hash = reconstruction.date.split('-').reduce((a, b) => a + parseInt(b, 10), 0) + reconstruction.region.length;
  const localRng = seededRandom(hash);

  const bounds = REGION_BOUNDS[reconstruction.region];
  
  // 1. Match floats by region (for demo, we just use floats that fall in bounds)
  const matchedFloats = DEMO_ARGO_FLOATS.filter(f => 
    f.lat >= bounds.latMin && f.lat <= bounds.latMax &&
    f.lon >= bounds.lonMin && f.lon <= bounds.lonMax
  );

  const matchedProfiles: import('../types/ocean').ARGOProfile[] = [];
  const validationPoints: ValidationPoint[] = [];

  // Re-generate grid lat/lon based on the grid shape
  const latCount = DEMO_LAT_POINTS;
  const lonCount = DEMO_LON_POINTS;

  matchedFloats.forEach(float => {
    // Find closest grid indices
    // using latAtIndex and lonAtIndex reverse:
    const latPercent = (float.lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
    const lonPercent = (float.lon - LON_MIN) / (LON_MAX - LON_MIN);
    
    let i = Math.round(latPercent * (latCount - 1));
    let j = Math.round(lonPercent * (lonCount - 1));
    
    // Safety clamp
    i = Math.max(0, Math.min(latCount - 1, i));
    j = Math.max(0, Math.min(lonCount - 1, j));

    const argoTemp: number[] = [];
    const predictedTemp: number[] = [];

    STANDARD_DEPTHS.forEach((depth, dIdx) => {
      let pred = reconstruction.data[dIdx]?.[i]?.[j];
      // fallback to generated if land/null in demo
      if (pred === null || pred === undefined) {
         pred = generateSubsurfaceTemperature(float.lat, float.lon, reconstruction.date)[dIdx];
      }
      
      const obs = pred + gaussianNoise(0.4, localRng) * (1 + dIdx * 0.02);
      const error = pred - obs; // EXACT CONVENTION: predicted - observed
      
      argoTemp.push(obs);
      predictedTemp.push(pred);

      validationPoints.push({
        profileId: float.id,
        latitude: float.lat,
        longitude: float.lon,
        date: float.date,
        depth,
        observedTemperature: obs,
        predictedTemperature: pred,
        error
      });
    });

    // Compute profile metrics
    const errors = predictedTemp.map((p, idx) => p - argoTemp[idx]);
    const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
    const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;
    const bias = errors.reduce((s, e) => s + e, 0) / errors.length;

    const meanP = predictedTemp.reduce((s, v) => s + v, 0) / predictedTemp.length;
    const meanA = argoTemp.reduce((s, v) => s + v, 0) / argoTemp.length;
    const cov = predictedTemp.reduce((s, p, idx) => s + (p - meanP) * (argoTemp[idx] - meanA), 0) / predictedTemp.length;
    const stdP = Math.sqrt(predictedTemp.reduce((s, p) => s + (p - meanP) ** 2, 0) / predictedTemp.length);
    const stdA = Math.sqrt(argoTemp.reduce((s, a) => s + (a - meanA) ** 2, 0) / argoTemp.length);
    const correlation = cov / ((stdP * stdA) || 1);
    
    const ssTot = argoTemp.reduce((s, a) => s + (a - meanA) ** 2, 0);
    const ssRes = errors.reduce((s, e) => s + e * e, 0);
    const r2 = 1 - ssRes / (ssTot || 1);

    matchedProfiles.push({
      floatId: float.id,
      lat: float.lat,
      lon: float.lon,
      date: float.date, // Demo keeps float date for simplicity, normally reconstruction date
      depths: [...STANDARD_DEPTHS],
      argoTemp,
      predictedTemp,
      rmse, mae, bias, correlation, r2
    });
  });

  // Calculate Overall Metrics from validationPoints
  const totalErrors = validationPoints.map(p => p.error);
  const overallRMSE = Math.sqrt(totalErrors.reduce((s, e) => s + e*e, 0) / (totalErrors.length || 1));
  const overallMAE = totalErrors.reduce((s, e) => s + Math.abs(e), 0) / (totalErrors.length || 1);
  const overallBias = totalErrors.reduce((s, e) => s + e, 0) / (totalErrors.length || 1);
  
  const meanPred = validationPoints.reduce((s, p) => s + p.predictedTemperature, 0) / (validationPoints.length || 1);
  const meanObs = validationPoints.reduce((s, p) => s + p.observedTemperature, 0) / (validationPoints.length || 1);
  
  let covTotal = 0, varPred = 0, varObs = 0, ssTotAll = 0, ssResAll = 0;
  validationPoints.forEach(p => {
    covTotal += (p.predictedTemperature - meanPred) * (p.observedTemperature - meanObs);
    varPred += Math.pow(p.predictedTemperature - meanPred, 2);
    varObs += Math.pow(p.observedTemperature - meanObs, 2);
    ssTotAll += Math.pow(p.observedTemperature - meanObs, 2);
    ssResAll += Math.pow(p.error, 2);
  });
  
  const overallCorrelation = covTotal / (Math.sqrt(varPred * varObs) || 1);
  const overallR2 = 1 - (ssResAll / (ssTotAll || 1));

  // Depth-wise metrics
  const depthMetrics = STANDARD_DEPTHS.map(depth => {
    const pts = validationPoints.filter(p => p.depth === depth);
    const errs = pts.map(p => p.error);
    const count = errs.length;
    const rmse = count ? Math.sqrt(errs.reduce((s, e) => s + e*e, 0) / count) : 0;
    const mae = count ? errs.reduce((s, e) => s + Math.abs(e), 0) / count : 0;
    const bias = count ? errs.reduce((s, e) => s + e, 0) / count : 0;
    return { depth, rmse, mae, bias, count };
  });

  // Band metrics
  const getBand = (dMin: number, dMax: number) => {
    const pts = validationPoints.filter(p => p.depth >= dMin && p.depth <= dMax);
    const errs = pts.map(p => p.error);
    const count = errs.length;
    const rmse = count ? Math.sqrt(errs.reduce((s, e) => s + e*e, 0) / count) : 0;
    const mae = count ? errs.reduce((s, e) => s + Math.abs(e), 0) / count : 0;
    return { rmse, mae };
  };

  return {
    reconstructionDate: reconstruction.date,
    reconstructionRegion: reconstruction.region,
    totalProfiles: DEMO_ARGO_FLOATS.length,
    matchedProfiles,
    validationPoints,
    overallMetrics: {
      overallRMSE, overallMAE, overallBias, overallCorrelation, overallR2,
      depthWiseRMSE: depthMetrics.map(d => ({ depth: d.depth, rmse: d.rmse })),
      totalProfiles: DEMO_ARGO_FLOATS.length,
      matchedProfiles: matchedProfiles.length,
      evaluationPeriod: 'Temporal Window: ±3 days',
      trainingTarget: 'GLORYS Global Ocean Reanalysis',
      validationSource: 'Independent ARGO Observations'
    },
    depthMetrics,
    bandMetrics: {
      upperOcean: getBand(0, 50),
      transitionRegion: getBand(75, 300),
      deepOcean: getBand(500, 1000)
    },
    metadata: {
      evaluationPeriod: 'Temporal Window: ±3 days',
      trainingTarget: 'GLORYS Global Ocean Reanalysis',
      validationSource: 'Independent ARGO Observations',
      mode: 'demo'
    }
  };
}

// ============================================================
// Uncertainty
// ============================================================

export function generateUncertaintyGrid(depthIndex: number, region: Region): OceanGrid {
  const bounds = REGION_BOUNDS[region];
  const depth = STANDARD_DEPTHS[depthIndex];
  const grid: OceanGrid = [];

  for (let i = 0; i < DEMO_LAT_POINTS; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < DEMO_LON_POINTS; j++) {
      const lat = latAtIndex(i);
      const lon = lonAtIndex(j);

      if (lat < bounds.latMin || lat > bounds.latMax || lon < bounds.lonMin || lon > bounds.lonMax) {
        row.push(null);
        continue;
      }
      if (isLand(lat, lon)) {
        row.push(null);
        continue;
      }

      // Uncertainty increases with depth, near coasts, and in data-sparse areas
      const depthFactor = 0.2 + (depth / 1000) * 0.8;
      const coastProximity = isLand(lat + 0.5, lon) || isLand(lat - 0.5, lon) ||
                             isLand(lat, lon + 0.5) || isLand(lat, lon - 0.5) ? 0.4 : 0;
      const uncertainty = depthFactor + coastProximity + Math.abs(gaussianNoise(0.1));
      row.push(Math.max(0.1, Math.min(2.0, uncertainty)));
    }
    grid.push(row);
  }
  return grid;
}

// ============================================================
// Model Metadata
// ============================================================

export const DEMO_MODELS: ModelMetadata[] = [
  {
    name: 'Baseline CNN',
    type: 'baseline_cnn',
    version: '0.1.0',
    parameterCount: '~1.2M',
    inputChannels: 7,
    inputResolution: '0.25° × 0.25°',
    temporalWindow: 1,
    embeddingDim: 64,
    outputDepths: [...STANDARD_DEPTHS],
    framework: 'PyTorch 2.x',
    trainingDataset: 'GLORYS12V1 (2020 Q1)',
    status: 'available',
  },
  {
    name: 'CNN + GRU',
    type: 'cnn_gru',
    version: '0.2.0',
    parameterCount: '~3.8M',
    inputChannels: 7,
    inputResolution: '0.25° × 0.25°',
    temporalWindow: 7,
    embeddingDim: 128,
    outputDepths: [...STANDARD_DEPTHS],
    framework: 'PyTorch 2.x',
    trainingDataset: 'GLORYS12V1 (2020 Q1)',
    status: 'available',
  },
  {
    name: 'OceanEmbed (Depth-Aware)',
    type: 'oceanembed',
    version: '1.0.0',
    parameterCount: '~5.2M',
    inputChannels: 9,
    inputResolution: '0.25° × 0.25°',
    temporalWindow: 7,
    embeddingDim: 128,
    outputDepths: [...STANDARD_DEPTHS],
    framework: 'PyTorch 2.x',
    trainingDataset: 'GLORYS12V1 (2020 Q1)',
    status: 'available',
  },
];

// ============================================================
// Data Quality
// ============================================================

export function generateDataQuality(variable: DisplayVariable): DataQuality {
  const baseCoverage = variable === 'sst' ? 92 : variable === 'sss' ? 78 : 85;
  return {
    coverage: baseCoverage + Math.round(gaussianNoise(2)),
    missingPercent: 100 - baseCoverage + Math.round(Math.abs(gaussianNoise(3))),
    validObservations: Math.round(baseCoverage * 1200 + gaussianNoise(500)),
    qualityScore: Math.min(100, Math.max(60, baseCoverage - 5 + Math.round(gaussianNoise(3)))),
    spatialCoverage: Math.min(100, baseCoverage + 3 + Math.round(Math.abs(gaussianNoise(2)))),
    temporalCoverage: Math.min(100, baseCoverage + 1 + Math.round(Math.abs(gaussianNoise(2)))),
  };
}

// ============================================================
// Time Series
// ============================================================

export function generateTimeSeries(
  variable: DisplayVariable,
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): { date: string; value: number }[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const points: { date: string; value: number }[] = [];

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfYear = getDayOfYear(dateStr);
    const value = generatePointValue(variable, lat, lon, dayOfYear);
    points.push({ date: dateStr, value: Math.round(value * 100) / 100 });
    current.setDate(current.getDate() + 1);
  }
  return points;
}

// ============================================================
// Phase 7: Demo Embeddings & Proxies
// ============================================================

export function generateDemoEmbedding(
  date: string,
  region: import('../types/ocean').Region,
  modelType: import('../types/ocean').ModelType,
  temporalWindow: number,
  inputVariables: import('../types/ocean').DisplayVariable[],
  lat: number,
  lon: number
): number[] {
  const seedString = `EMBED_${date}_${region}_${modelType}_${temporalWindow}_${inputVariables.sort().join(',')}_${lat.toFixed(1)}_${lon.toFixed(1)}`;
  const rng = seededRandom(hashString(seedString));
  
  // Generate a 128D deterministic vector
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    const val = (rng() * 2 - 1) * Math.sqrt(-2 * Math.log(rng() + 1e-10)) * Math.cos(2 * Math.PI * rng());
    embedding.push(val);
  }
  
  // Apply a fake ReLU for visualization variance (creates sparse representations)
  return embedding.map(x => Math.max(0, x + 0.5));
}

export function calculateThermoclineProxy(profile: number[]): { depth: number, gradient: number } | null {
  if (!profile || profile.length !== STANDARD_DEPTHS.length) return null;
  
  let maxGradient = 0;
  let maxGradientDepth = 0;
  
  // Find depth of maximum dT/dz
  for (let i = 0; i < profile.length - 1; i++) {
    const dz = STANDARD_DEPTHS[i+1] - STANDARD_DEPTHS[i];
    if (dz === 0) continue;
    
    const dT = profile[i] - profile[i+1]; // Temp decreases with depth usually, so positive is a drop
    const gradient = Math.abs(dT / dz);
    
    if (gradient > maxGradient) {
      maxGradient = gradient;
      // Interpolate roughly to the midpoint of the layer
      maxGradientDepth = STANDARD_DEPTHS[i] + (dz / 2);
    }
  }
  
  return { depth: maxGradientDepth, gradient: maxGradient };
}

export function calculateHeatContentProxy(profile: number[]): number | null {
  if (!profile || profile.length !== STANDARD_DEPTHS.length) return null;
  
  // Simple discrete integration: Sum of (T_i * dz_i)
  let heatContent = 0;
  for (let i = 0; i < profile.length - 1; i++) {
    const dz = STANDARD_DEPTHS[i+1] - STANDARD_DEPTHS[i];
    const avgT = (profile[i] + profile[i+1]) / 2;
    heatContent += avgT * dz;
  }
  
  return heatContent;
}
