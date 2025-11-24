import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hostel } from '../types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
    hostels: Hostel[];
    onHostelClick?: (hostel: Hostel) => void;
    center?: [number, number];
    zoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
    hostels,
    onHostelClick,
    center = [33.6844, 73.0479], // Islamabad, Pakistan
    zoom = 12
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(mapRef.current);
        }

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add markers for hostels
        hostels.forEach((hostel) => {
            // For demo purposes, generate random coordinates near the center
            // In production, hostels should have actual coordinates
            const lat = center[0] + (Math.random() - 0.5) * 0.1;
            const lng = center[1] + (Math.random() - 0.5) * 0.1;

            const marker = L.marker([lat, lng])
                .addTo(mapRef.current!)
                .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg mb-1">${hostel.name}</h3>
            <p class="text-sm text-gray-600 mb-1">${hostel.location}</p>
            <p class="text-blue-600 font-semibold">Rs ${hostel.price}/month</p>
            <p class="text-sm text-gray-500 mt-1">${hostel.category}</p>
          </div>
        `);

            if (onHostelClick) {
                marker.on('click', () => onHostelClick(hostel));
            }

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
        };
    }, [hostels, center, zoom, onHostelClick]);

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ minHeight: '500px' }} />
        </div>
    );
};

export default MapView;
