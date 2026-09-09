import { useRef, useCallback } from 'react';
import { useOcean } from '../../store/OceanContext';
import { runReconstruction, type ReconstructionConfig } from '../../data/api';

export function useReconstructionWorkflow() {
  const { state, setReconstructionStatus, setReconstructionResult, setError } = useOcean();
  
  // Track the current run to prevent race conditions.
  const runIdRef = useRef<number>(0);

  const startReconstruction = useCallback(async () => {
    // Increment run ID so older runs are ignored if they complete later
    const currentRunId = ++runIdRef.current;

    try {
      setReconstructionStatus('LOADING');
      setError(null);
      
      const config: ReconstructionConfig = {
        date: state.selectedDate,
        region: state.selectedRegion,
        model: state.selectedModel,
        temporalWindow: state.temporalWindow,
        inputVariables: state.selectedVariables,
      };

      // Simulate a multi-step workflow for the UI, checking runId at each step
      const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      if (currentRunId !== runIdRef.current) return;
      setReconstructionStatus('PREPROCESSING');
      await simulateDelay(600);

      if (currentRunId !== runIdRef.current) return;
      setReconstructionStatus('EMBEDDING');
      await simulateDelay(800);

      if (currentRunId !== runIdRef.current) return;
      setReconstructionStatus('INFERENCE');
      
      // Actual API or Demo Generation happens here
      const result = await runReconstruction(config);
      await simulateDelay(1000); // Give user time to see 'INFERENCE'

      if (currentRunId !== runIdRef.current) return;
      setReconstructionStatus('POST-PROCESSING');
      await simulateDelay(500);

      if (currentRunId !== runIdRef.current) return;
      setReconstructionResult(result);
      setReconstructionStatus('COMPLETE');

    } catch (err) {
      if (currentRunId === runIdRef.current) {
        setError(err instanceof Error ? err.message : 'Reconstruction failed');
        setReconstructionStatus('ERROR');
      }
    }
  }, [
    state.selectedDate,
    state.selectedRegion,
    state.selectedModel,
    state.temporalWindow,
    state.selectedVariables,
    setReconstructionStatus,
    setReconstructionResult,
    setError
  ]);

  return {
    startReconstruction
  };
}
