import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ExplainabilityMapProps {
    width?: number;
    height?: number;
}

const ExplainabilityMap: React.FC<ExplainabilityMapProps> = ({ width = 241, height = 101 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8000/api/v1/explain');
                const heatmapData = response.data.heatmap; // 2D array of shape [height][width]
                
                if (canvasRef.current && heatmapData) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const imgData = ctx.createImageData(width, height);
                        
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                const val = heatmapData[y][x];
                                const i = (y * width + x) * 4;
                                
                                // Color mapping: Blue (0) -> Green -> Red (1)
                                const r = Math.min(255, Math.max(0, val * 255 * 2));
                                const g = Math.min(255, Math.max(0, (1 - Math.abs(val - 0.5) * 2) * 255));
                                const b = Math.min(255, Math.max(0, (1 - val) * 255 * 2));
                                
                                imgData.data[i] = r;
                                imgData.data[i+1] = g;
                                imgData.data[i+2] = b;
                                imgData.data[i+3] = Math.floor(val * 200); // Alpha channel based on importance
                            }
                        }
                        ctx.putImageData(imgData, 0, 0);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load explainability data');
                console.error("Explainability error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmap();
    }, [width, height]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px', background: '#111', borderRadius: '8px', overflow: 'hidden' }}>
            {loading && <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>Generating Saliency Map...</div>}
            {error && <div style={{ position: 'absolute', top: 10, left: 10, color: 'red' }}>{error}</div>}
            
            <h4 style={{ position: 'absolute', top: 5, right: 10, color: 'white', margin: 0, textShadow: '1px 1px 2px black' }}>
                XAI: Saliency Heatmap
            </h4>
            
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height}
                style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
            />
        </div>
    );
};

export default ExplainabilityMap;
