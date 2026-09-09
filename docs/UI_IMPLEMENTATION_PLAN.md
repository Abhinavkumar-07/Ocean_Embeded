# Phase 4: Temperature Reconstruction - UI Implementation Plan

## Objective
Transform the Temperature Reconstruction placeholder into the core functional module of OceanEmbed, demonstrating the central AI inference workflow from surface satellite observations to subsurface temperature reconstruction.

## Requirements Overview
- **Shared Context**: Reuse `OceanContext` for `selectedRegion`, `selectedDate`, `selectedLatitude`, `selectedLongitude`, etc.
- **Workflow Integrity**: Implement a 4-step workflow indicator (INPUTS -> MODEL -> INFERENCE -> RESULTS).
- **Input Configuration Panel**: Region, Date, Variables, Temporal Window, Depth Range, Model.
- **Run Reconstruction**: Action button triggering progress simulation/API calls.
- **Inference Progress**: Step-by-step progress indicator (Preprocessing -> Embedding -> Inference -> Post-processing).
- **Result Map**: Interactive map with depth slider (0m - 1000m), dynamically updating title and legend.
- **Vertical Profile**: Chart mapping temperature vs. depth for a selected point, with comparison to reference GLORYS/ARGO data if available.
- **Model Explanation & Metadata**: Architecture explanation and metadata panel.
- **Backend/Demo Support**: Use `api.ts` with demo fallback from `demoData.ts`.
- **Navigation**: "Explore in 3D" and "Validate with ARGO" buttons.

## State Changes (`src/types/ocean.ts`, `src/store/OceanContext.tsx`)
- Add `temporalWindow` (number) to `OceanState`.
- Add `selectedVariables` (DisplayVariable[]) to `OceanState`.
- Add `reconstructionStatus` ('IDLE' | 'LOADING' | 'PREPROCESSING' | 'EMBEDDING' | 'INFERENCE' | 'POST-PROCESSING' | 'COMPLETE' | 'STALE' | 'ERROR') to `OceanState`.
- Add `reconstructionResult` (ReconstructionResult | null) to `OceanState`.
- Add corresponding actions to `oceanReducer`.

## Component: `src/pages/TemperatureReconstructionPage.tsx`
- Layout matching scientific workspace.
- **Header**: Title, Subtitle, Workflow Indicator.
- **Input Panel**: 
  - Region (Reuse `RegionSelector` or internal component)
  - Date (Reuse `DateRangePicker` or internal)
  - Variables (Checkboxes)
  - Temporal Window (1, 3, 5, 7 days)
  - Model Selection (Cards)
- **Status Panel / Explanation**: Progress UI during inference.
- **Result Grid**:
  - `MapComponent` with `selectedDepth` support.
  - Depth Slider component.
- **Profile Grid**:
  - Vertical Profile Chart (Line chart with Depth on Y-axis reversed, Temperature on X-axis).
  - Selected point info.
- **Metadata Grid**:
  - Model Metadata card.
  - Input fields preview.

## Verification
- Stale state handling when inputs change after a result.
- Context preservation when navigating to 3D Ocean or Validation pages.
- TypeScript strict compiler rules (`noUnusedLocals`, `noUnusedParameters`).
- Browser tests for UI layout, responsiveness, and state synchronization.
