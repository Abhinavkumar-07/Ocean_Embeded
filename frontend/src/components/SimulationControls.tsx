import React, { useState } from 'react';
import { useOcean } from '../store/OceanContext';

const SimulationControls: React.FC = () => {
    const { 
        state, 
        setSimulationStatus, 
        setScenarioInputs, 
        setScenarioResult, 
        setScenarioActive, 
        setDisplayMode, 
        resetScenario 
    } = useOcean();

    const [sstAnomaly, setSstAnomaly] = useState<number>(0);
    const [windAnomaly, setWindAnomaly] = useState<number>(0);
    const [currentAnomaly, setCurrentAnomaly] = useState<number>(0);

    const handleSimulate = async () => {
        if (!state.inferenceData || state.inferenceData.length === 0 || !state.profile?.predicted) {
            console.error("Baseline inference data not available for scenario calculation.");
            return;
        }

        setSimulationStatus('running');

        // Use setTimeout to allow the React state to update the UI button to "Running Scenario..."
        setTimeout(() => {
            try {
                // Determine the grid coordinates for the exact profile extraction
                const latIdx = Math.round((state.selectedLatitude - 5) / 25 * 50);
                const lonIdx = Math.round((state.selectedLongitude - 45) / 60 * 120);

                // Apply deterministic perturbation formula to the entire baseline 3D grid
                const scenarioTemperatureField = state.inferenceData.map((layer, layerIdx) => {
                    const depth = state.depths[layerIdx];
                    const depthFactor = Math.exp(-depth / 150);

                    return layer.map((row, rIdx) => {
                        // Reconstruct approximate lat/lon for spatial modulation
                        const lat = 5 + (rIdx / 50) * 25;
                        
                        return row.map((val, cIdx) => {
                            if (val === null) return null; // Masked out areas remain null

                            const lon = 45 + (cIdx / 120) * 60;

                            const spatialFactor = 0.85 + 0.15 * Math.sin((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180);

                            const deltaTemperature = spatialFactor * (
                                sstAnomaly * depthFactor +
                                windAnomaly * 0.15 * Math.exp(-depth / 100) +
                                currentAnomaly * 0.05 * Math.exp(-depth / 200)
                            );

                            return val + deltaTemperature;
                        });
                    });
                });

                // Extract exact scenario profile using the same grid extraction math
                const scenarioProfile = scenarioTemperatureField.map(layer => {
                    if (layer[latIdx] && layer[latIdx][lonIdx] !== undefined && layer[latIdx][lonIdx] !== null) {
                        return layer[latIdx][lonIdx] as number;
                    }
                    return null;
                });

                // Fallback: If grid extraction yields nulls (due to clipping or masks), apply the formula directly to the existing profile
                const finalProfile = scenarioProfile.includes(null) 
                    ? state.profile!.predicted.map((val, layerIdx) => {
                        const depth = state.depths[layerIdx];
                        const depthFactor = Math.exp(-depth / 150);
                        const spatialFactor = 0.85 + 0.15 * Math.sin((state.selectedLatitude * Math.PI) / 180) * Math.cos((state.selectedLongitude * Math.PI) / 180);
                        const deltaTemperature = spatialFactor * (
                            sstAnomaly * depthFactor +
                            windAnomaly * 0.15 * Math.exp(-depth / 100) +
                            currentAnomaly * 0.05 * Math.exp(-depth / 200)
                        );
                        return val + deltaTemperature;
                      })
                    : (scenarioProfile as number[]);

                // Dispatch global scenario result
                const inputs = { sstAnomaly, windAnomaly, currentAnomaly };
                setScenarioInputs(inputs);
                setScenarioResult({
                    temperatureField: scenarioTemperatureField,
                    profile: finalProfile,
                    metrics: null, // Metrics are calculated at display time based on active profile
                    scenarioInputs: inputs,
                    createdAt: new Date().toISOString()
                });
                
                setScenarioActive(true);
                setDisplayMode('scenario');
                setSimulationStatus('complete');

            } catch (error) {
                console.error("Scenario calculation error", error);
                setSimulationStatus('error');
            }
        }, 100);
    };

    const handleReset = () => {
        setSstAnomaly(0);
        setWindAnomaly(0);
        setCurrentAnomaly(0);
        resetScenario();
    };

    const isRunning = state.simulationStatus === 'running';

    return (
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', color: 'white' }}>
            <h3 style={{ marginTop: 0 }}>What-If Simulator</h3>
            
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    SST Anomaly (°C): {sstAnomaly.toFixed(1)}
                </label>
                <input 
                    type="range" 
                    min="-5" max="5" step="0.1" 
                    value={sstAnomaly} 
                    onChange={(e) => setSstAnomaly(parseFloat(e.target.value))}
                    disabled={isRunning}
                    style={{ width: '100%' }}
                />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Wind Anomaly (m/s): {windAnomaly.toFixed(1)}
                </label>
                <input 
                    type="range" 
                    min="-10" max="10" step="0.5" 
                    value={windAnomaly} 
                    onChange={(e) => setWindAnomaly(parseFloat(e.target.value))}
                    disabled={isRunning}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Current Anomaly (m/s): {currentAnomaly.toFixed(1)}
                </label>
                <input 
                    type="range" 
                    min="-2" max="2" step="0.1" 
                    value={currentAnomaly} 
                    onChange={(e) => setCurrentAnomaly(parseFloat(e.target.value))}
                    disabled={isRunning}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={handleSimulate} 
                    disabled={isRunning}
                    style={{ 
                        flex: 1, padding: '0.5rem', 
                        background: isRunning ? '#6b7280' : '#3b82f6', 
                        color: 'white', border: 'none', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer' 
                    }}
                >
                    {isRunning ? "Running Scenario..." : "Run Simulation"}
                </button>
                <button 
                    onClick={handleReset} 
                    disabled={isRunning}
                    style={{ padding: '0.5rem', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer' }}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SimulationControls;
