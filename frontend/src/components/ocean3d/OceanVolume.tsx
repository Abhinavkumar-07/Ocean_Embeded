import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Ocean3DInstance } from '../../features/ocean3d/useOcean3DData';
import { ThreeEvent } from '@react-three/fiber';

interface OceanVolumeProps {
  instances: Ocean3DInstance[];
  positions: Float32Array;
  colors: Float32Array;
  meta: any;
  viewMode: 'volume' | 'layer' | 'slice';
  selectedDepthIndex: number;
  sliceType: 'latitude' | 'longitude';
  sliceCoord: number;
  onPointSelect: (instance: Ocean3DInstance) => void;
}

const dummy = new THREE.Object3D();

export const OceanVolume: React.FC<OceanVolumeProps> = ({
  instances,
  positions,
  colors,
  meta,
  viewMode,
  selectedDepthIndex,
  sliceType,
  sliceCoord,
  onPointSelect
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // We need to rebuild the instanced mesh when instances change
  // Actually, setting the matrices once is fine.
  
  const count = instances.length;
  
  // We use useMemo to only compute matrices when filters change
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    
    // Default scale based on meta
    const baseScale = meta.pointSize || 0.15;
    
    // We update the transformation matrices of all instances
    for (let i = 0; i < count; i++) {
      const inst = instances[i];
      let visible = true;
      
      if (viewMode === 'layer') {
        visible = inst.depthIndex === selectedDepthIndex;
      } else if (viewMode === 'slice') {
        if (sliceType === 'latitude') {
          // Compare with small tolerance to avoid float issues
          visible = Math.abs(inst.lat - sliceCoord) < 0.1;
        } else {
          visible = Math.abs(inst.lon - sliceCoord) < 0.1;
        }
      }
      
      const s = visible ? baseScale : 0;
      
      dummy.position.set(positions[i*3], positions[i*3+1], positions[i*3+2]);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      mesh.setMatrixAt(i, dummy.matrix);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
  }, [instances, positions, viewMode, selectedDepthIndex, sliceType, sliceCoord, meta.pointSize, count]);

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onPointSelect(instances[e.instanceId]);
    }
  };

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, count]} 
      onPointerUp={handlePointerUp}
    >
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshBasicMaterial vertexColors={true} transparent opacity={viewMode === 'volume' ? 0.8 : 1.0} />
    </instancedMesh>
  );
};
