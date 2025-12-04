import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Hostel {
    _id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    images: string[];
    amenities: string[];
}

interface MapSearchProps {
    hostels: Hostel[];
    onSelectHostel: (hostel: Hostel) => void;
}

// Component to update map center when hostels change
const MapUpdater: React.FC<{ hostels: Hostel[] }> = ({ hostels }) => {
    const map = useMap();

    useEffect(() => {
        if (hostels.length > 0) {
            // Calculate center based on first hostel or average
            // For simplicity, using the first hostel's location if we could geocode it.
            // Since we don't have lat/lng in the Hostel interface yet, we'll default to a known location (e.g., Lahore)
            // In a real app, we would geocode the address string to coordinates.

            // For this demo, let's assume some mock coordinates or default to Lahore
            map.setView([31.5204, 74.3587], 13); // Lahore
        }
    }, [hostels, map]);

    return null;
};

const MapSearch: React.FC<MapSearchProps> = ({ hostels, onSelectHostel }) => {
    // Mock function to generate coordinates from location string (deterministic hash for demo)
    const getCoordinates = (location: string): [number, number] => {
        // This is a placeholder. In production, use a Geocoding API.
        // Generating pseudo-random coordinates around Lahore for demo purposes
        const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const latOffset = (hash % 100) / 1000;
        const lngOffset = ((hash * 2) % 100) / 1000;
        return [31.5204 + latOffset, 74.3587 + lngOffset];
    };

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-md relative z-0">
            <MapContainer
                center={[31.5204, 74.3587]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater hostels={hostels} />

                {hostels.map((hostel) => {
                    const position = getCoordinates(hostel.location);
                    return (
                        <Marker key={hostel._id} position={position}>
                            <Popup>
                                <div className="min-w-[200px]">
                                    <img
                                        src={hostel.images[0] || 'https://via.placeholder.com/150'}
                                        alt={hostel.name}
                                        className="w-full h-32 object-cover rounded-t-lg mb-2"
                                    />
                                    <h3 className="font-bold text-sm">{hostel.name}</h3>
                                    <p className="text-xs text-gray-600">{hostel.location}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-blue-600 font-bold text-sm">PKR {hostel.price}</span>
                                        <span className="text-yellow-500 text-xs">⭐ {hostel.rating}</span>
                                    </div>
                                    <button
                                        onClick={() => onSelectHostel(hostel)}
                                        className="mt-2 w-full bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapSearch;
