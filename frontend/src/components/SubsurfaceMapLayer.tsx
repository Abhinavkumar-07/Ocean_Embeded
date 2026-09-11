import { useEffect, useRef, useState } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { REGION_BOUNDS } from '../types/ocean';

import type { OceanGrid } from '../types/ocean';

interface SubsurfaceMapLayerProps {
  data: OceanGrid | null; // 2D array of temperatures for the selected depth
  region: string;
  minTemp?: number;
  maxTemp?: number;
}

  export const SubsurfaceMapLayer = ({ data, region }: SubsurfaceMapLayerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
  
    useEffect(() => {
      if (!data || data.length === 0) {
        setImageUrl(null);
        return;
      }
  
      // Calculate dynamic min and max for this specific layer
      let minTemp = Infinity;
      let maxTemp = -Infinity;
      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
          const val = data[y][x];
          if (val !== null && !isNaN(val)) {
            if (val < minTemp) minTemp = val;
            if (val > maxTemp) maxTemp = val;
          }
        }
      }
      
      // Ensure there's a small range if it's perfectly uniform
      if (maxTemp - minTemp < 0.1) {
        maxTemp += 0.05;
        minTemp -= 0.05;
      }
  
      const height = data.length;
      const width = data[0].length;
  
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      const imgData = ctx.createImageData(width, height);
  
      // Simple Jet color scale for temperature
      const getColor = (value: number | null) => {
        if (value === null || isNaN(value)) {
           return [0, 0, 0, 0]; // Transparent for land/masked
        }
        const v = Math.max(0, Math.min(1, (value - minTemp) / (maxTemp - minTemp)));
        const r = Math.max(0, Math.min(255, Math.round(255 * (1.5 - Math.abs(1 - 4 * (v - 0.5))))));
        const g = Math.max(0, Math.min(255, Math.round(255 * (1.5 - Math.abs(1 - 4 * (v - 0.25))))));
        const b = Math.max(0, Math.min(255, Math.round(255 * (1.5 - Math.abs(1 - 4 * v)))));
        return [r, g, b, 200]; // Semi-transparent
      };

    // Note: The numpy array comes as [lat][lon], where lat 0 is likely the MIN latitude (South), 
    // but Leaflet ImageOverlay draws from South to North if bounds are defined that way.
    // However, usually HTML canvas draws y=0 at the TOP. 
    // If lat 0 is South, y=0 should map to the bottom. We need to flip Y when drawing to canvas.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = data[height - 1 - y][x];
        const color = getColor(val);
        const idx = (y * width + x) * 4;
        imgData.data[idx] = color[0];
        imgData.data[idx + 1] = color[1];
        imgData.data[idx + 2] = color[2];
        imgData.data[idx + 3] = color[3];
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setImageUrl(canvas.toDataURL());
  }, [data]);

  const bounds = REGION_BOUNDS[region as keyof typeof REGION_BOUNDS];
  if (!bounds || !imageUrl) {
    return <canvas ref={canvasRef} style={{ display: 'none' }} />;
  }

  // Leaflet bounds format: [[south, west], [north, east]]
  // The demo data grid always spans LAT_MIN=5 to LAT_MAX=30, LON_MIN=45 to LON_MAX=105.
  const leafletBounds: [[number, number], [number, number]] = [
    [5, 45],
    [30, 105]
  ];

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <ImageOverlay url={imageUrl} bounds={leafletBounds} opacity={0.65} />
    </>
  );
};
