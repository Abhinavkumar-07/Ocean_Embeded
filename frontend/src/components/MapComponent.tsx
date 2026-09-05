import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Heatmap } from './Heatmap';

export const MapComponent = ({ surfaceData }: any) => {
  // Indian Ocean Bounds
  const position: [number, number] = [15.6, 88.4]; // Center of Bay of Bengal

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer 
        center={position} 
        zoom={5} 
        style={{ width: '100%', height: '100%', background: '#060B11' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {/* NASA GIBS Sea Surface Temperature (GHRSST) Overlay */}
        <TileLayer
          attribution='&copy; <a href="https://earthdata.nasa.gov/gibs">NASA EOSDIS GIBS</a>'
          url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2020-01-15/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png"
          opacity={0.65}
          maxNativeZoom={7}
        />
        
        <CircleMarker center={position} radius={8} pathOptions={{ color: '#F97316', fillColor: '#F97316', fillOpacity: 0.8 }}>
          <Popup>
            <div style={{ color: 'black' }}>
              <strong>15.6° N, 88.4° E</strong><br/>
              Selected ARGO Profile Location
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>



      {/* Legend / Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(14, 23, 34, 0.9)',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid var(--card-border)'
      }}>
        <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>SST (°C)</div>
        <div style={{ width: '200px', height: '10px', background: 'linear-gradient(to right, #00008B, #00BFFF, #00FF00, #FFFF00, #FF0000)', borderRadius: '5px' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
          <span>20</span>
          <span>24</span>
          <span>28</span>
          <span>32</span>
        </div>
      </div>
    </div>
  );
};
