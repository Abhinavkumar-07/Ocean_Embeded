import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { OceanVolume } from './OceanVolume';
import type { Ocean3DInstance } from '../../features/ocean3d/useOcean3DData';

interface OceanSceneProps {
  instances: Ocean3DInstance[];
  positions: Float32Array;
  colors: Float32Array;
  meta: any;
  bounds: any;
  viewMode: 'volume' | 'layer' | 'slice';
  selectedDepthIndex: number;
  sliceType: 'latitude' | 'longitude';
  sliceCoord: number;
  onPointSelect: (instance: Ocean3DInstance) => void;
  showGrid: boolean;
}

export const OceanScene: React.FC<OceanSceneProps> = ({
  instances,
  positions,
  colors,
  meta,
  bounds,
  viewMode,
  selectedDepthIndex,
  sliceType,
  sliceCoord,
  onPointSelect,
  showGrid
}) => {
  return (
    <Canvas camera={{ position: [5, 3, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <OrbitControls makeDefault />

      {instances.length > 0 && (
        <OceanVolume 
          instances={instances}
          positions={positions}
          colors={colors}
          meta={meta}
          viewMode={viewMode}
          selectedDepthIndex={selectedDepthIndex}
          sliceType={sliceType}
          sliceCoord={sliceCoord}
          onPointSelect={onPointSelect}
        />
      )}

      {/* Center Indicator */}
      {bounds && (
        <group position={[0, 0, 0]}>
           {showGrid && (
             <Grid 
               args={[10, 10]} 
               cellSize={1} 
               cellThickness={1} 
               cellColor="#1e293b" 
               sectionSize={5} 
               sectionThickness={1.5} 
               sectionColor="#334155" 
               fadeDistance={20} 
               fadeStrength={1} 
             />
           )}
           {/* Basic Cardinal Directions */}
           <Text position={[0, 0, -5.5]} fontSize={0.3} color="white" rotation={[-Math.PI / 2, 0, 0]}>N</Text>
           <Text position={[0, 0, 5.5]} fontSize={0.3} color="white" rotation={[-Math.PI / 2, 0, 0]}>S</Text>
           <Text position={[5.5, 0, 0]} fontSize={0.3} color="white" rotation={[-Math.PI / 2, 0, 0]}>E</Text>
           <Text position={[-5.5, 0, 0]} fontSize={0.3} color="white" rotation={[-Math.PI / 2, 0, 0]}>W</Text>
        </group>
      )}
    </Canvas>
  );
};
