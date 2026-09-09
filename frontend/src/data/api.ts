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
} from './demoData';

const API_URL = 'http://localhost:8000/api/v1';
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { data: data as T, fromBackend: true };
  } catch {
    return { data: null, fromBackend: false };
  }
}

// ============================================================
// Public API Functions
// ============================================================

interface SurfaceResponse {
  data: OceanGrid;
}

export async function fetchSurfaceData(
  variable: DisplayVariable,
  date: string,
  region: Region
): Promise<{ data: OceanGrid; isDemo: boolean }> {
  // Try backend first (existing endpoint returns SST grid)
  if (variable === 'sst') {
    const result = await tryFetch<SurfaceResponse>(`${API_URL}/data/surface`);
    if (result.data?.data) {
      return { data: result.data.data, isDemo: false };
    }
  }
  // Fallback to demo data
  return { data: generateSurfaceGrid(variable, date, region), isDemo: true };
}

interface InferenceResponse {
  data: OceanGrid[];
  depths: number[];
}

export async function fetchInferenceData(): Promise<{ data: OceanGrid[]; depths: number[]; isDemo: boolean }> {
  const result = await tryFetch<InferenceResponse>(`${API_URL}/inference`);
  if (result.data?.data) {
    return { data: result.data.data, depths: result.data.depths, isDemo: false };
  }
  // Fallback: generate demo reconstruction
  const demo = generateFullReconstruction('2020-02-15', 'Bay of Bengal', 'oceanembed', 7, ['sst', 'sss', 'ssh', 'current', 'wind']);
  return { data: demo.data, depths: demo.depths, isDemo: true };
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
  date: string
): Promise<{ profile: TemperatureProfile; isDemo: boolean }> {
  const result = await tryFetch<ProfileResponse>(`${API_URL}/profile?lat=${lat}&lon=${lon}`);
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
  // Fallback
  return { profile: generateProfile(lat, lon, date), isDemo: true };
}

interface SimulateRequest {
  sst_anomaly: number;
  wind_anomaly: number;
  current_anomaly: number;
}

export async function fetchSimulation(
  params: SimulateRequest
): Promise<{ data: OceanGrid[] | null; depths: number[]; isDemo: boolean }> {
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

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_URL}/data/surface`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
