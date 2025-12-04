import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hostel } from '../types';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HostelMapProps {
    hostels: Hostel[];
    onHostelClick: (hostel: Hostel) => void;
    center?: [number, number];
    zoom?: number;
}

// Component to recenter map when hostels change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const HostelMap: React.FC<HostelMapProps> = ({
    hostels,
    onHostelClick,
    center = [33.6844, 73.0479], // Default: Islamabad
    zoom = 12
}) => {
    // Calculate center based on hostels if available
    const mapCenter = hostels.length > 0 && hostels[0].coordinates?.coordinates
        ? [hostels[0].coordinates.coordinates[1], hostels[0].coordinates.coordinates[0]] as [number, number]
        : center;

    // Create custom marker icon with price
    const createPriceMarker = (price: number) => {
        return L.divIcon({
            className: 'custom-price-marker',
            html: `
                <div style="
                    background: #3b82f6;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 12px;
                    white-space: nowrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    border: 2px solid white;
                ">
                    Rs ${price.toLocaleString()}
                </div>
            `,
            iconSize: [80, 30],
            iconAnchor: [40, 15]
        });
    };

    return (
        <div className="w-full h-full relative rounded-lg overflow-hidden">
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <MapUpdater center={mapCenter} zoom={zoom} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hostels.map((hostel) => {
                    // Skip if no coordinates
                    if (!hostel.coordinates?.coordinates ||
                        hostel.coordinates.coordinates[0] === 0 &&
                        hostel.coordinates.coordinates[1] === 0) {
                        return null;
                    }

                    const position: [number, number] = [
                        hostel.coordinates.coordinates[1], // latitude
                        hostel.coordinates.coordinates[0]  // longitude
                    ];

                    return (
                        <Marker
                            key={hostel.id}
                            position={position}
                            icon={createPriceMarker(hostel.price)}
                        >
                            <Popup>
                                <div className="w-64">
                                    {hostel.images && hostel.images.length > 0 && (
                                        <img
                                            src={hostel.images[0]}
                                            alt={hostel.name}
                                            className="w-full h-32 object-cover rounded-t-lg mb-2"
                                        />
                                    )}
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                                        {hostel.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        📍 {hostel.location}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        💰 Rs {hostel.price.toLocaleString()}/month
                                    </p>
                                    <p className="text-sm text-gray-600 mb-3">
                                        ⭐ {hostel.rating?.toFixed(1) || 'No ratings'}
                                    </p>
                                    <button
                                        onClick={() => onHostelClick(hostel)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[1000]">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <strong>🗺️ Map Legend</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    Click markers to view details
                </p>
            </div>
        </div>
    );
};

export default HostelMap;
