// ============================================================
// OceanEmbed — Domain Types
// ============================================================

// --- Scientific Constants ---

export const STANDARD_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000] as const;
export type StandardDepth = typeof STANDARD_DEPTHS[number];

export const SURFACE_VARIABLES = ['sst', 'sss', 'ssh', 'current_u', 'current_v', 'wind_u', 'wind_v'] as const;
export type SurfaceVariable = typeof SURFACE_VARIABLES[number];

export const DISPLAY_VARIABLES = ['sst', 'sss', 'ssh', 'current', 'wind'] as const;
export type DisplayVariable = typeof DISPLAY_VARIABLES[number];

export const REGIONS = ['North Indian Ocean', 'Arabian Sea', 'Bay of Bengal'] as const;
export type Region = typeof REGIONS[number];

export const MODEL_TYPES = ['baseline_cnn', 'cnn_gru', 'oceanembed'] as const;
export type ModelType = typeof MODEL_TYPES[number];

// --- Geographic ---

export interface LatLon {
  lat: number;
  lon: number;
}

export interface BoundingBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export const REGION_BOUNDS: Record<Region, BoundingBox> = {
  'North Indian Ocean': { latMin: 5, latMax: 30, lonMin: 45, lonMax: 105 },
  'Arabian Sea':        { latMin: 5, latMax: 25, lonMin: 45, lonMax: 78 },
  'Bay of Bengal':      { latMin: 5, latMax: 23, lonMin: 78, lonMax: 100 },
};

export const REGION_CENTERS: Record<Region, LatLon> = {
  'North Indian Ocean': { lat: 15, lon: 75 },
  'Arabian Sea':        { lat: 15, lon: 65 },
  'Bay of Bengal':      { lat: 15, lon: 88 },
};

// --- Variable Metadata ---

export interface VariableInfo {
  id: SurfaceVariable | DisplayVariable;
  name: string;
  longName: string;
  unit: string;
  range: [number, number];
  colorScale: 'thermal' | 'haline' | 'diverging' | 'speed';
}

export const VARIABLE_META: Record<DisplayVariable, VariableInfo> = {
  sst:     { id: 'sst',     name: 'SST',      longName: 'Sea Surface Temperature',    unit: '°C',  range: [20, 32],    colorScale: 'thermal' },
  sss:     { id: 'sss',     name: 'SSS',      longName: 'Sea Surface Salinity',       unit: 'PSU', range: [30, 38],    colorScale: 'haline' },
  ssh:     { id: 'ssh',     name: 'SSH/SLA',  longName: 'Sea Level Anomaly',          unit: 'm',   range: [-0.5, 0.5], colorScale: 'diverging' },
  current: { id: 'current', name: 'Current',  longName: 'Surface Current Speed',      unit: 'm/s', range: [0, 2],      colorScale: 'speed' },
  wind:    { id: 'wind',    name: 'Wind',     longName: 'Surface Wind Speed',         unit: 'm/s', range: [0, 15],     colorScale: 'speed' },
};

// --- Data Structures ---

/** 2D grid of scalar values (lat × lon) */
export type OceanGrid = (number | null)[][];

/** A single satellite observation at a point */
export interface SatelliteObservation {
  date: string;
  lat: number;
  lon: number;
  variable: DisplayVariable;
  value: number;
  unit: string;
  source: string;
  qualityFlag: 'good' | 'suspect' | 'missing';
}

/** Temperature profile at a location (depth → temperature) */
export interface TemperatureProfile {
  lat: number;
  lon: number;
  date: string;
  depths: number[];
  predicted: number[];
  observed: number[];
  soundSpeed: number[];
  source: 'model' | 'argo' | 'glorys';
}

/** ARGO float metadata */
export interface ARGOFloat {
  id: string;
  lat: number;
  lon: number;
  date: string;
  numProfiles: number;
  status: 'active' | 'inactive';
}

/** ARGO profile comparison */
export interface ARGOProfile {
  floatId: string;
  lat: number;
  lon: number;
  date: string;
  depths: number[];
  argoTemp: number[];
  predictedTemp: number[];
  rmse: number;
  mae: number;
  bias: number;
  correlation: number;
  r2: number;
}

/** Validation metrics summary */
export interface ValidationMetrics {
  overallRMSE: number;
  overallMAE: number;
  overallBias: number;
  overallCorrelation: number;
  overallR2: number;
  depthWiseRMSE: { depth: number; rmse: number }[];
  totalProfiles: number;
  matchedProfiles: number;
  evaluationPeriod: string;
  trainingTarget: string;
  validationSource: string;
}

/** Individual validation point for precise comparison */
export interface ValidationPoint {
  profileId: string;
  latitude: number;
  longitude: number;
  date: string;
  depth: number;
  observedTemperature: number;
  predictedTemperature: number;
  error: number; // predicted - observed
}

/** Complete validation result matching a reconstruction */
export interface ValidationResult {
  reconstructionDate: string;
  reconstructionRegion: Region;
  totalProfiles: number;
  matchedProfiles: ARGOProfile[];
  validationPoints: ValidationPoint[];
  
  overallMetrics: ValidationMetrics;
  depthMetrics: { depth: number; rmse: number; mae: number; bias: number; count: number }[];
  bandMetrics: {
    upperOcean: { rmse: number; mae: number };       // 0-50m
    transitionRegion: { rmse: number; mae: number }; // 75-300m
    deepOcean: { rmse: number; mae: number };        // 500-1000m
  };

  metadata: {
    evaluationPeriod: string;
    trainingTarget: string;     // GLORYS
    validationSource: string;   // ARGO
    mode: 'demo' | 'live';
  };
}

/** Reconstruction result */
export interface ReconstructionResult {
  data: OceanGrid[];  // depth × lat × lon
  depths: number[];
  date: string;
  region: Region;
  spatialResolution: string;
  model: ModelType;
  metadata: ModelMetadata;
  temporalWindow: number;
  inputVariables: DisplayVariable[];
  mode: DataSource;
  timestamp: string;
}

/** Model metadata */
export interface ModelMetadata {
  name: string;
  type: ModelType;
  version: string;
  parameterCount: string;
  inputChannels: number;
  inputResolution: string;
  temporalWindow: number;
  embeddingDim: number;
  outputDepths: number[];
  framework: string;
  trainingDataset: string;
  status: 'available' | 'experimental' | 'planned';
}

/** Uncertainty field */
export interface UncertaintyField {
  data: OceanGrid[];  // depth × lat × lon
  depths: number[];
  method: string;
  meanUncertainty: number;
  medianUncertainty: number;
  maxUncertainty: number;
  highUncertaintyPercent: number;
}

/** Data quality summary */
export interface DataQuality {
  coverage: number;       // 0–100%
  missingPercent: number;
  validObservations: number;
  qualityScore: number;   // 0–100
  spatialCoverage: number;
  temporalCoverage: number;
}

// --- Scenario State ---
export interface ScenarioInputs {
  sstAnomaly: number;
  windAnomaly: number;
  currentAnomaly: number;
}

export interface ScenarioResult {
  temperatureField: OceanGrid[];
  profile: number[];
  metrics: any;
  scenarioInputs: ScenarioInputs;
  createdAt: string;
}

export type DisplayMode = 'baseline' | 'scenario';

// --- Application State ---

export type DataSource = 'live' | 'demo' | 'research';

export interface OceanState {
  // Selection
  selectedSource: string;
  selectedDate: string;
  selectedRegion: Region;
  selectedLatitude: number;
  selectedLongitude: number;
  selectedDepth: number;
  selectedDepthIndex: number;
  selectedVariable: DisplayVariable;
  selectedVariables: DisplayVariable[];
  selectedModel: ModelType;
  selectedTimeRange: { start: string; end: string };
  temporalWindow: number;

  // Mode
  demoMode: boolean;
  dataSource: DataSource;

  // Data (loaded)
  surfaceData: OceanGrid;
  surfaceMetrics: any | null; // will be typed to SurfaceMetrics in api.ts or context
  inferenceData: OceanGrid[];
  depths: number[];
  profile: TemperatureProfile | null;

  // UI
  loading: boolean;
  error: string | null;
  activePage: string;
  reconstructionStatus: 'IDLE' | 'LOADING' | 'PREPROCESSING' | 'EMBEDDING' | 'INFERENCE' | 'POST-PROCESSING' | 'COMPLETE' | 'STALE' | 'ERROR';
  reconstructionResult: ReconstructionResult | null;
  validationResult: ValidationResult | null;

  // Scenario Mode
  scenarioInputs: ScenarioInputs;
  scenarioResult: ScenarioResult | null;
  scenarioActive: boolean;
  displayMode: DisplayMode;
  simulationStatus: 'idle' | 'running' | 'complete' | 'error';
}

export type OceanAction =
  | { type: 'SET_SOURCE';      payload: string }
  | { type: 'SET_DATE';        payload: string }
  | { type: 'SET_REGION';      payload: Region }
  | { type: 'SET_LOCATION';    payload: LatLon }
  | { type: 'SET_DEPTH';       payload: number }
  | { type: 'SET_VARIABLE';    payload: DisplayVariable }
  | { type: 'SET_MODEL';       payload: ModelType }
  | { type: 'SET_TIME_RANGE';  payload: { start: string; end: string } }
  | { type: 'SET_DEMO_MODE';   payload: boolean }
  | { type: 'SET_SURFACE_DATA'; payload: OceanGrid }
  | { type: 'SET_SURFACE_METRICS'; payload: any | null }
  | { type: 'SET_INFERENCE_DATA'; payload: { data: OceanGrid[]; depths: number[] } }
  | { type: 'SET_PROFILE';     payload: TemperatureProfile | null }
  | { type: 'SET_LOADING';     payload: boolean }
  | { type: 'SET_ERROR';       payload: string | null }
  | { type: 'SET_PAGE';        payload: string }
  | { type: 'SET_SELECTED_VARIABLES'; payload: DisplayVariable[] }
  | { type: 'SET_TEMPORAL_WINDOW'; payload: number }
  | { type: 'SET_RECONSTRUCTION_STATUS'; payload: OceanState['reconstructionStatus'] }
  | { type: 'SET_RECONSTRUCTION_RESULT'; payload: ReconstructionResult | null }
  | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult | null }
  | { type: 'SET_SCENARIO_INPUTS'; payload: ScenarioInputs }
  | { type: 'SET_SCENARIO_RESULT'; payload: ScenarioResult | null }
  | { type: 'SET_SCENARIO_ACTIVE'; payload: boolean }
  | { type: 'SET_DISPLAY_MODE'; payload: DisplayMode }
  | { type: 'SET_SIMULATION_STATUS'; payload: OceanState['simulationStatus'] }
  | { type: 'RESET_SCENARIO' };
