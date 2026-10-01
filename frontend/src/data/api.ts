// ============================================================
// OceanEmbed — Centralized API Layer
// ============================================================
// All backend requests go through this module.
// Automatically falls back to demo data when the backend is unavailable.
// ============================================================

import type { OceanGrid, TemperatureProfile, DisplayVariable, Region, ModelType, ReconstructionResult } from '../types/ocean';
import {
  generateSurfaceGrid,
  generateProfile,
  generateFullReconstruction,
  generateValidationResult,
  getDayOfYear,
  generatePointValue,
  isLand,
  gaussianNoise,
  seededRandom,
  hashString
} from './demoData';

// Same-origin in production (served by FastAPI); Vite proxies /api to the backend in dev.
export const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const TIMEOUT_MS = 5000;

// --- Helpers ---

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function tryFetch<T>(url: string, options?: RequestInit): Promise<{ data: T | null; fromBackend: boolean }> {
  try {
    const response = await fetchWithTimeout(url, options);
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.warn(`[OceanEmbed API] ${url} returned ${response.status}: ${errorBody}`);
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    // Defense-in-depth: check if the response body contains an error field
    if (data && typeof data === 'object' && 'error' in data) {
      console.warn(`[OceanEmbed API] ${url} returned error:`, data.error);
      return { data: null, fromBackend: false };
    }
    return { data: data as T, fromBackend: true };
  } catch (err) {
    console.warn(`[OceanEmbed API] Falling back to demo data for ${url}:`, err);
    return { data: null, fromBackend: false };
  }
}

// ============================================================
// Public API Functions
// ============================================================

interface SurfaceResponse {
  data: OceanGrid;
}

export interface SurfaceMetrics {
  sst: number | null;
  sss: number | null;
  ssh: number | null;
  wind_u: number | null;
  wind_v: number | null;
  current_u: number | null;
  current_v: number | null;
}

export async function fetchSurfaceData(
  variable: DisplayVariable,
  date: string,
  region: Region,
  isDemoMode: boolean
): Promise<{ data: OceanGrid | null; isDemo: boolean }> {
  if (isDemoMode) {
    return { data: generateSurfaceGrid(variable, date, region), isDemo: true };
  }

  const result = await tryFetch<SurfaceResponse>(`${API_URL}/data/surface?variable=${variable}&date=${date}`);
  if (result.data?.data) {
    return { data: result.data.data, isDemo: false };
  }
  
  return { data: null, isDemo: false };
}

export async function fetchSurfaceMetrics(lat: number, lon: number, date: string, isDemoMode: boolean): Promise<SurfaceMetrics | null> {
  if (isDemoMode) {
    const dayOfYear = getDayOfYear(date);

  
  // Helper to get raw deterministic value
  const sst = generatePointValue('sst', lat, lon, dayOfYear);
  const sss = generatePointValue('sss', lat, lon, dayOfYear);
  const ssh = generatePointValue('ssh', lat, lon, dayOfYear);
  const currentMag = generatePointValue('current', lat, lon, dayOfYear);
  const windMag = generatePointValue('wind', lat, lon, dayOfYear);
  
  // Fake U/V splits for demo purposes (real mode will provide true U/V)
  const angle = gaussianNoise(1, seededRandom(hashString(`angle_${lat}_${lon}_${date}`))) * Math.PI;
  
  return {
    sst: isLand(lat, lon) ? null : sst,
    sss: isLand(lat, lon) ? null : sss,
    ssh: isLand(lat, lon) ? null : ssh,
    wind_u: isLand(lat, lon) ? null : windMag * Math.cos(angle),
    wind_v: isLand(lat, lon) ? null : windMag * Math.sin(angle),
    current_u: isLand(lat, lon) ? null : currentMag * Math.cos(angle + 0.5),
    current_v: isLand(lat, lon) ? null : currentMag * Math.sin(angle + 0.5),
  };
  }
  
  const result = await tryFetch<SurfaceMetrics>(`${API_URL}/data/metrics?lat=${lat}&lon=${lon}&date=${date}`);
  return result.data || null;
}

interface InferenceResponse {
  data: OceanGrid[];
  depths: number[];
}

export async function fetchInferenceData(date: string, region: Region, isDemoMode: boolean): Promise<{ data: OceanGrid[]; depths: number[]; isDemo: boolean }> {
  if (isDemoMode) {
    const demo = generateFullReconstruction(date, region, 'oceanembed', 7, ['sst', 'sss', 'ssh', 'current', 'wind']);
    return { data: demo.data, depths: demo.depths, isDemo: true };
  }

  const result = await tryFetch<InferenceResponse>(`${API_URL}/inference?date=${date}`);
  if (result.data?.data) {
    return { data: result.data.data, depths: result.data.depths, isDemo: false };
  }
  
  return { data: [], depths: [], isDemo: false };
}

export interface ReconstructionConfig {
  date: string;
  region: Region;
  model: ModelType;
  temporalWindow: number;
  inputVariables: DisplayVariable[];
}

export async function runReconstruction(config: ReconstructionConfig): Promise<ReconstructionResult> {
  // Ideally tryFetch from backend...
  // Fallback to deterministic demo
  return generateFullReconstruction(
    config.date,
    config.region,
    config.model,
    config.temporalWindow,
    config.inputVariables
  );
}

export async function getValidationResult(reconstruction: ReconstructionResult): Promise<import('../types/ocean').ValidationResult> {
  const result = await tryFetch<import('../types/ocean').ValidationResult>(`${API_URL}/validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      date: reconstruction.date, 
      region: reconstruction.region 
    })
  });
  
  if (result.data) {
    return { ...result.data, metadata: { ...result.data.metadata, mode: 'live' } };
  }
  
  // Fallback to deterministic demo mode
  return generateValidationResult(reconstruction);
}

interface ProfileResponse {
  depths: number[];
  predicted: number[];
  observed: number[];
  sound_speed: number[];
}

export async function fetchProfile(
  lat: number,
  lon: number,
  date: string,
  isDemoMode: boolean
): Promise<{ profile: TemperatureProfile | null; isDemo: boolean }> {
  if (isDemoMode) {
    return { profile: generateProfile(lat, lon, date), isDemo: true };
  }

  const result = await tryFetch<ProfileResponse>(`${API_URL}/profile?lat=${lat}&lon=${lon}&date=${date}`);
  if (result.data?.depths) {
    return {
      profile: {
        lat, lon, date,
        depths: result.data.depths,
        predicted: result.data.predicted,
        observed: result.data.observed,
        soundSpeed: result.data.sound_speed,
        source: 'model',
      },
      isDemo: false,
    };
  }
  
  return { profile: null, isDemo: false };
}

interface SimulateRequest {
  sst_anomaly: number;
  wind_anomaly: number;
  current_anomaly: number;
}

export async function fetchSimulation(
  params: SimulateRequest,
  date: string,
  region: Region,
  isDemoMode: boolean
): Promise<{ data: OceanGrid[] | null; depths: number[]; isDemo: boolean }> {
  if (isDemoMode) {
    // Generate base demo data
    const demo = generateFullReconstruction(date, region, 'oceanembed', 7, ['sst', 'sss', 'ssh', 'current', 'wind']);
    
    // Apply anomalies to the surface layers (e.g. top 3 layers) to simulate the what-if
    const simData = demo.data.map((layer, layerIdx) => {
       // Only apply SST anomaly to the top 50m (roughly first 3-5 layers)
       if (layerIdx > 4 || params.sst_anomaly === 0) return layer;
       
       // Create a new modified layer
       const decay = 1 - (layerIdx / 5); // Anomaly decays with depth
       return layer.map(row => 
         row.map(val => val !== null ? val + (params.sst_anomaly * decay) : null)
       );
    });
    
    return { data: simData, depths: demo.depths, isDemo: true };
  }

  const result = await tryFetch<InferenceResponse>(`${API_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (result.data?.data) {
    return { data: result.data.data, depths: result.data.depths, isDemo: false };
  }
  return { data: null, depths: [], isDemo: true };
}

export async function fetchExplainability(): Promise<{ heatmap: number[][] | null; isDemo: boolean }> {
  const result = await tryFetch<{ heatmap: number[][] }>(`${API_URL}/explain`);
  if (result.data?.heatmap) {
    return { heatmap: result.data.heatmap, isDemo: false };
  }
  return { heatmap: null, isDemo: true };
}

// ============================================================
// Backend health check
// ============================================================

export interface BackendHealth {
  status: 'live' | 'error' | 'offline';
  model_loaded: boolean;
  sample_loaded: boolean;
  prediction_cached: boolean;
  startup_error: string | null;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetchWithTimeout(`${API_URL}/health`);
    if (!response.ok) return { status: 'offline', model_loaded: false, sample_loaded: false, prediction_cached: false, startup_error: 'Backend not reachable' };
    const data = await response.json();
    return {
      status: data.model_loaded ? 'live' : 'error',
      model_loaded: data.model_loaded ?? false,
      sample_loaded: data.sample_loaded ?? false,
      prediction_cached: data.prediction_cached ?? false,
      startup_error: data.startup_error ?? null,
    };
  } catch {
    return { status: 'offline', model_loaded: false, sample_loaded: false, prediction_cached: false, startup_error: 'Backend not reachable' };
  }
}

