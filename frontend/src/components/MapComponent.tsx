import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useOcean } from '../store/OceanContext';
import { REGION_CENTERS, VARIABLE_META, REGION_BOUNDS } from '../types/ocean';

// Helper component to center map and handle clicks
const MapController = () => {
  const { state, setLocation } = useOcean();
  const map = useMap();

  useEffect(() => {
    const center = REGION_CENTERS[state.selectedRegion];
    const bounds = REGION_BOUNDS[state.selectedRegion];
    if (center && bounds) {
      map.setView([center.lat, center.lon], 5);
    }
  }, [state.selectedRegion, map]);

  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
    }
  });

  return null;
};

interface MapComponentProps {
  surfaceData?: any;
  validationMarkers?: { id: string; lat: number; lon: number; rmse: number; selected?: boolean }[];
  onMarkerSelect?: (id: string) => void;
}

export const MapComponent = ({ surfaceData: _surfaceData, validationMarkers, onMarkerSelect }: MapComponentProps) => {
  const { state } = useOcean();
  
  const center = REGION_CENTERS[state.selectedRegion];
  const position: [number, number] = [state.selectedLatitude || center.lat, state.selectedLongitude || center.lon];
  const meta = VARIABLE_META[state.selectedVariable];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer 
        center={[center.lat, center.lon]} 
        zoom={5} 
        style={{ width: '100%', height: '100%', background: '#060B11' }}
        zoomControl={true}
      >
        <MapController />
        
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
        
        {/* Standard Selection Marker (Reticle) */}
        {!validationMarkers && position && (
          <>
            <CircleMarker center={position} radius={12} pathOptions={{ color: '#ffffff', fillColor: 'transparent', weight: 2, dashArray: '4 4' }} />
            <CircleMarker center={position} radius={4} pathOptions={{ color: '#38BDF8', fillColor: '#38BDF8', fillOpacity: 1 }}>
              <Popup>
                <div style={{ color: 'black' }}>
                  <strong>{position[0].toFixed(2)}° N, {position[1].toFixed(2)}° E</strong><br/>
                  Selected Location
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Validation Markers */}
        {validationMarkers && validationMarkers.map(m => {
          // Color based on RMSE conceptually (e.g. < 0.5 green, < 1 yellow, else red)
          const color = m.rmse < 0.5 ? '#10B981' : m.rmse < 1.0 ? '#F59E0B' : '#EF4444';
          return (
            <CircleMarker 
              key={m.id} 
              center={[m.lat, m.lon]} 
              radius={m.selected ? 10 : 6} 
              pathOptions={{ 
                color: m.selected ? 'white' : color, 
                fillColor: color, 
                fillOpacity: m.selected ? 1 : 0.6,
                weight: m.selected ? 3 : 1
              }}
              eventHandlers={{
                click: () => onMarkerSelect && onMarkerSelect(m.id)
              }}
            >
              <Popup>
                <div style={{ color: 'black' }}>
                  <strong>Float {m.id}</strong><br/>
                  RMSE: {m.rmse.toFixed(2)} °C
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
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
        <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>{meta.name} ({meta.unit})</div>
        <div style={{ 
          width: '200px', 
          height: '10px', 
          background: meta.colorScale === 'haline' ? 'linear-gradient(to right, #00BFFF, #00008B)' 
                     : meta.colorScale === 'speed' ? 'linear-gradient(to right, #00008B, #00FF00, #FFFF00)' 
                     : 'linear-gradient(to right, #00008B, #00BFFF, #00FF00, #FFFF00, #FF0000)', 
          borderRadius: '5px' 
        }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
          <span>{meta.range[0]}</span>
          <span>{(meta.range[0] + meta.range[1]) / 2}</span>
          <span>{meta.range[1]}</span>
        </div>
      </div>
    </div>
  );
};
