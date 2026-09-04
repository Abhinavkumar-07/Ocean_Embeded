import React, { useRef, useEffect } from 'react';
import { Heatmap } from './Heatmap';

export const Stack3D = ({ inferenceData, depths, activeDepthIndex, onDepthChange }: any) => {
  if (!inferenceData || inferenceData.length === 0) return <div>No data</div>;

  const displayIndices = [0, 2, 5, 8, 11, 14]; 
  
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      
      {/* 3D Stack Container (Isometric Orthographic Projection) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '300px', height: '300px' }}>
        <div style={{ 
          position: 'relative', 
          width: '200px', 
          height: '200px',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(60deg) rotateZ(-45deg)'
        }}>
          {displayIndices.map((layerIndex, stackIdx) => {
            const data = inferenceData[layerIndex];
            if (!data) return null;
            
            const zOffset = (displayIndices.length - 1 - stackIdx) * 40;
            const isActive = activeDepthIndex === layerIndex;

            return (
              <div 
                key={layerIndex} 
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  transform: `translateZ(${zOffset}px)`,
                  transition: 'all 0.3s ease',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Embedded 3D perfectly-aligned label */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDepthChange(layerIndex);
                  }}
                  style={{
                    position: 'absolute',
                    left: '-70px',
                    top: '100px', // Center of the left edge
                    // Inverse transform cancels the parent rotation exactly.
                    // The translateY(12px) shifts it slightly down to align with the visual 'body' of the layer.
                    transform: 'translateY(-50%) rotateZ(45deg) rotateX(-60deg) translateY(12px)', 
                    transformOrigin: 'center center',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', marginRight: '8px' }}>
                    {depths[layerIndex]} m
                  </span>
                  <div style={{ 
                    width: '12px', height: '12px', borderRadius: '50%', 
                    background: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    border: '2px solid var(--card-bg)',
                  }}></div>
                </div>

                {/* Heatmap Layer */}
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  opacity: isActive ? 1 : 0.4,
                  border: isActive ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isActive ? '0 0 20px rgba(56, 189, 248, 0.5)' : 'none',
                  background: 'rgba(0,0,0,0.6)',
                  transition: 'all 0.3s ease',
                }}>
                   <Heatmap data={data} min={4} max={30} width={200} height={200} hideLegend={true} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
