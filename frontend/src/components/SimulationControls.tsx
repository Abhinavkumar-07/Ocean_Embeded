import React, { useState } from 'react';

interface SimulationControlsProps {
    onSimulationResult: (data: any) => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ onSimulationResult }) => {
    const [sstAnomaly, setSstAnomaly] = useState<number>(0);
    const [windAnomaly, setWindAnomaly] = useState<number>(0);
    const [currentAnomaly, setCurrentAnomaly] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sst_anomaly: sstAnomaly,
                    wind_anomaly: windAnomaly,
                    current_anomaly: currentAnomaly
                })
            });
            const data = await response.json();
            onSimulationResult(data);
        } catch (error) {
            console.error("Simulation error", error);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSstAnomaly(0);
        setWindAnomaly(0);
        setCurrentAnomaly(0);
    };

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
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={handleSimulate} 
                    disabled={loading}
                    style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Simulating...' : 'Run Simulation'}
                </button>
                <button 
                    onClick={reset}
                    style={{ padding: '0.5rem', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SimulationControls;
