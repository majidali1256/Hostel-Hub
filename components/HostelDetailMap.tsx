import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to force map size recalculation
function MapSizeHelper() {
  const map = useMap();
  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (map) map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface HostelDetailMapProps {
  coordinates: [number, number]; // GeoJSON format: [longitude, latitude]
  hostelName: string;
}

const HostelDetailMap: React.FC<HostelDetailMapProps> = ({ coordinates, hostelName }) => {
  // Check if coordinates valid
  const hasValidCoordinates = coordinates && coordinates.length === 2 && coordinates[0] !== 0 && coordinates[1] !== 0;
  
  // Note: Leaflet uses [latitude, longitude] natively, which is [coordinates[1], coordinates[0]] in GeoJSON
  const position: [number, number] = hasValidCoordinates 
    ? [coordinates[1], coordinates[0]] 
    : [33.6844, 73.0479]; // Default: Islamabad

  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
      <MapContainer 
        center={position} 
        zoom={hasValidCoordinates ? 15 : 11} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSizeHelper />
        <Marker position={position}>
          <Popup>
            <strong>{hostelName}</strong>
            <br />
            {hasValidCoordinates ? 'Exact Location' : 'Default City Location'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default React.memo(HostelDetailMap);
