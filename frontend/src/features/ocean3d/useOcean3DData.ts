import { useMemo } from 'react';
import type { ReconstructionResult } from '../../types/ocean';
import * as THREE from 'three';

export interface Ocean3DInstance {
  id: number;
  lat: number;
  lon: number;
  depthIndex: number;
  depth: number;
  value: number;
}

export function useOcean3DData(
  result: ReconstructionResult | null,
  depths: number[],
  latitudes: number[],
  longitudes: number[]
) {
  return useMemo(() => {
    if (!result || !result.data || result.data.length === 0) {
      return { instances: [], positions: new Float32Array(0), colors: new Float32Array(0), bounds: null, meta: null };
    }

    const minTemp = 4;
    const maxTemp = 32;

    const instances: Ocean3DInstance[] = [];

    const depthCount = result.data.length;
    const latCount = result.data[0].length;
    const lonCount = result.data[0][0].length;
    
    // Total possible points
    let validCount = 0;
    for (let d = 0; d < depthCount; d++) {
      for (let latIdx = 0; latIdx < latCount; latIdx++) {
        for (let lonIdx = 0; lonIdx < lonCount; lonIdx++) {
          if (result.data[d][latIdx][lonIdx] !== null) {
            validCount++;
          }
        }
      }
    }

    const positions = new Float32Array(validCount * 3);
    const colors = new Float32Array(validCount * 3);
    
    const colorObj = new THREE.Color();
    
    // Function to get color from temperature (ocean scale)
    const getColor = (value: number) => {
      const norm = Math.max(0, Math.min(1, (value - minTemp) / (maxTemp - minTemp)));
      if (norm < 0.5) {
        const n2 = norm * 2;
        colorObj.setRGB(0, (n2 * 202) / 255, (100 + n2 * 128) / 255);
      } else {
        const n2 = (norm - 0.5) * 2;
        colorObj.setRGB((n2 * 255) / 255, (202 + n2 * 53) / 255, (228 + n2 * 27) / 255);
      }
      return colorObj;
    };

    // Calculate center for normalizing coordinates around (0,0,0)
    const centerLat = latitudes[Math.floor(latitudes.length / 2)];
    const centerLon = longitudes[Math.floor(longitudes.length / 2)];
    
    // Scale factors to fit the model nicely in a 10x10x10 Three.js box
    const lonRange = longitudes[longitudes.length - 1] - longitudes[0];
    
    // Base scale on longitude
    const scale = 10 / (lonRange || 1); 
    
    let offset = 0;
    let idx = 0;

    for (let d = 0; d < depthCount; d++) {
      // Exaggerate depth for visibility (e.g. 1000m mapped to 3 units deep)
      const maxDepth = depths[depths.length - 1] || 1000;
      const depthY = - (depths[d] / maxDepth) * 3; 

      for (let latIdx = 0; latIdx < latCount; latIdx++) {
        const lat = latitudes[latIdx];
        const latZ = - (lat - centerLat) * scale; // Z is inverted in threejs

        for (let lonIdx = 0; lonIdx < lonCount; lonIdx++) {
          const val = result.data[d][latIdx][lonIdx];
          
          if (val !== null) {
            const lon = longitudes[lonIdx];
            const lonX = (lon - centerLon) * scale;

            // X = Longitude, Y = -Depth, Z = -Latitude
            positions[offset] = lonX;
            positions[offset + 1] = depthY;
            positions[offset + 2] = latZ;

            getColor(val);
            colors[offset] = colorObj.r;
            colors[offset + 1] = colorObj.g;
            colors[offset + 2] = colorObj.b;

            instances.push({
              id: idx,
              lat,
              lon,
              depthIndex: d,
              depth: depths[d],
              value: val
            });

            offset += 3;
            idx++;
          }
        }
      }
    }

    return { 
      instances, 
      positions, 
      colors,
      bounds: { scale, centerLat, centerLon },
      meta: {
         minTemp,
         maxTemp,
         pointSize: 0.15
      }
    };
  }, [result, depths, latitudes, longitudes]);
}
