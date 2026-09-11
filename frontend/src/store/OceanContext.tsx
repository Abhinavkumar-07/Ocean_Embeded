import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { OceanState, OceanAction, Region, DisplayVariable, ModelType, LatLon, OceanGrid, TemperatureProfile } from '../types/ocean';
import { STANDARD_DEPTHS } from '../types/ocean';

// ============================================================
// Initial State
// ============================================================

// const today = new Date().toISOString().split('T')[0];

const initialState: OceanState = {
  // Selection
  selectedSource: 'MODIS',
  selectedDate: '2022-01-07',
  selectedRegion: 'Bay of Bengal',
  selectedLatitude: 15.0,
  selectedLongitude: 88.0,
  selectedDepth: 0,
  selectedDepthIndex: 0,
  selectedVariable: 'sst',
  selectedVariables: ['sst', 'sss', 'ssh', 'current', 'wind'],
  selectedModel: 'oceanembed',
  selectedTimeRange: { start: '2020-02-08', end: '2020-02-15' },
  temporalWindow: 7,

  // Mode
  demoMode: true,
  dataSource: 'demo',

  // Data
  surfaceData: [],
  surfaceMetrics: null,
  inferenceData: [],
  depths: [...STANDARD_DEPTHS],
  profile: null,

  // UI
  loading: false,
  error: null,
  activePage: 'Dashboard',
  reconstructionStatus: 'IDLE',
  reconstructionResult: null,
  validationResult: null,
};

// ============================================================
// Reducer
// ============================================================

function oceanReducer(state: OceanState, action: OceanAction): OceanState {
  switch (action.type) {
    case 'SET_SOURCE':
      return { ...state, selectedSource: action.payload };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };

    case 'SET_REGION':
      return { ...state, selectedRegion: action.payload };

    case 'SET_LOCATION': {
      const { lat, lon } = action.payload;
      let newRegion = state.selectedRegion;
      
      // Auto-switch region based on longitude to make map clicking more intuitive
      if (lon < 78 && state.selectedRegion === 'Bay of Bengal') newRegion = 'Arabian Sea';
      else if (lon >= 78 && state.selectedRegion === 'Arabian Sea') newRegion = 'Bay of Bengal';
      else if (state.selectedRegion === 'North Indian Ocean') newRegion = 'North Indian Ocean'; // Keep full view if selected

      return {
        ...state,
        selectedLatitude: lat,
        selectedLongitude: lon,
        selectedRegion: newRegion,
      };
    }

    case 'SET_DEPTH': {
      const idx = STANDARD_DEPTHS.indexOf(action.payload as typeof STANDARD_DEPTHS[number]);
      return {
        ...state,
        selectedDepth: action.payload,
        selectedDepthIndex: idx >= 0 ? idx : state.selectedDepthIndex,
      };
    }

    case 'SET_VARIABLE':
      return { ...state, selectedVariable: action.payload };

    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };

    case 'SET_TIME_RANGE':
      return { ...state, selectedTimeRange: action.payload };

    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.payload, dataSource: action.payload ? 'demo' : 'live' };

    case 'SET_SURFACE_DATA':
      return { ...state, surfaceData: action.payload };
      
    case 'SET_SURFACE_METRICS':
      return { ...state, surfaceMetrics: action.payload };

    case 'SET_INFERENCE_DATA':
      return { ...state, inferenceData: action.payload.data, depths: action.payload.depths };

    case 'SET_PROFILE':
      return { ...state, profile: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_PAGE':
      return { ...state, activePage: action.payload };

    case 'SET_SELECTED_VARIABLES':
      return { ...state, selectedVariables: action.payload };

    case 'SET_TEMPORAL_WINDOW':
      return { ...state, temporalWindow: action.payload };

    case 'SET_RECONSTRUCTION_STATUS':
      return { ...state, reconstructionStatus: action.payload };

    case 'SET_RECONSTRUCTION_RESULT':
      return { ...state, reconstructionResult: action.payload };

    case 'SET_VALIDATION_RESULT':
      return { ...state, validationResult: action.payload };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface OceanContextValue {
  state: OceanState;
  dispatch: React.Dispatch<OceanAction>;

  // Convenience setters
  setSource:     (s: string) => void;
  setDate:       (date: string) => void;
  setRegion:     (region: Region) => void;
  setLocation:   (loc: LatLon) => void;
  setDepth:      (depth: number) => void;
  setVariable:   (v: DisplayVariable) => void;
  setSelectedVariables: (vars: DisplayVariable[]) => void;
  setModel:      (m: ModelType) => void;
  setTimeRange:  (range: { start: string; end: string }) => void;
  setTemporalWindow: (w: number) => void;
  setPage:       (page: string) => void;
  setSurfaceData:(data: OceanGrid) => void;
  setSurfaceMetrics:(data: any | null) => void;
  setInferenceData: (data: OceanGrid[], depths: number[]) => void;
  setProfile:    (p: TemperatureProfile | null) => void;
  setLoading:    (l: boolean) => void;
  setError:      (e: string | null) => void;
  setReconstructionStatus: (status: OceanState['reconstructionStatus']) => void;
  setReconstructionResult: (res: OceanState['reconstructionResult']) => void;
  setValidationResult: (res: any) => void;
}

const OceanContext = createContext<OceanContextValue | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function OceanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(oceanReducer, initialState);

  const value: OceanContextValue = {
    state,
    dispatch,
    setSource:       (s)    => dispatch({ type: 'SET_SOURCE',         payload: s }),
    setDate:         (d)    => dispatch({ type: 'SET_DATE',           payload: d }),
    setRegion:       (r)    => dispatch({ type: 'SET_REGION',         payload: r }),
    setLocation:     (loc)  => dispatch({ type: 'SET_LOCATION',       payload: loc }),
    setDepth:        (d)    => dispatch({ type: 'SET_DEPTH',          payload: d }),
    setVariable:     (v)    => dispatch({ type: 'SET_VARIABLE',       payload: v }),
    setSelectedVariables: (vars) => dispatch({ type: 'SET_SELECTED_VARIABLES', payload: vars }),
    setModel:        (m)    => dispatch({ type: 'SET_MODEL',          payload: m }),
    setTimeRange:    (r)    => dispatch({ type: 'SET_TIME_RANGE',     payload: r }),
    setTemporalWindow:(w)   => dispatch({ type: 'SET_TEMPORAL_WINDOW', payload: w }),
    setPage:         (p)    => dispatch({ type: 'SET_PAGE',           payload: p }),
    setSurfaceData:  (d)    => dispatch({ type: 'SET_SURFACE_DATA',   payload: d }),
    setSurfaceMetrics:(d)   => dispatch({ type: 'SET_SURFACE_METRICS', payload: d }),
    setInferenceData:(d, depths) => dispatch({ type: 'SET_INFERENCE_DATA', payload: { data: d, depths } }),
    setProfile:      (p)    => dispatch({ type: 'SET_PROFILE',        payload: p }),
    setLoading:      (l)    => dispatch({ type: 'SET_LOADING',        payload: l }),
    setError:        (e)    => dispatch({ type: 'SET_ERROR',          payload: e }),
    setReconstructionStatus: (s) => dispatch({ type: 'SET_RECONSTRUCTION_STATUS', payload: s }),
    setReconstructionResult: (r) => dispatch({ type: 'SET_RECONSTRUCTION_RESULT', payload: r }),
    setValidationResult:     (r) => dispatch({ type: 'SET_VALIDATION_RESULT',    payload: r }),
  };

  return (
    <OceanContext.Provider value={value}>
      {children}
    </OceanContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useOcean(): OceanContextValue {
  const ctx = useContext(OceanContext);
  if (!ctx) {
    throw new Error('useOcean must be used within an <OceanProvider>');
  }
  return ctx;
}
