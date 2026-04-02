
import React, { useState, useEffect, useMemo } from 'react';
import { Hostel, HostelCategory } from '../types';
import Input from './Input';
import Button from './Button';
import PriceEstimator from './PriceEstimator';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { debounce } from 'lodash';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker position={position}></Marker>
  );
}

// Helper to pan the map dynamically when search updates it
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}


interface PropertyListingFormProps {
    onSubmit: (hostel: Omit<Hostel, 'id' | 'rating'> & { id?: string; rating?: number }) => void;
    onCancel: () => void;
    initialData?: Hostel | null;
}

const MAX_IMAGES = 10;
const MAX_VIDEOS = 2;
const MAX_TOUR360 = 5;

interface MediaItem {
    preview: string;
    file?: File;
}

const PropertyListingForm: React.FC<PropertyListingFormProps> = ({ onSubmit, onCancel, initialData }) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [capacity, setCapacity] = useState('1');
    const [amenities, setAmenities] = useState('');
    const [roomCategory, setRoomCategory] = useState('Shared Room');
    const [genderPreference, setGenderPreference] = useState<HostelCategory>('any');


    const [images, setImages] = useState<MediaItem[]>([]);
    const [videos, setVideos] = useState<MediaItem[]>([]);
    const [tour360, setTour360] = useState<MediaItem[]>([]);

    const [mapPosition, setMapPosition] = useState<[number, number]>([33.6844, 73.0479]); // Default Islamabad
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapPosition([latitude, longitude]);
                setIsGettingLocation(false);
            },
            (error) => {
                console.error("Error getting location: ", error);
                alert("Unable to retrieve your location. Please ensure you have granted location access.");
                setIsGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // Geocoding function to pan map when typing
    const searchLocation = useMemo(
        () => 
            debounce(async (searchQuery: string) => {
                if (!searchQuery || searchQuery.length < 3) return;
                setIsSearchingMap(true);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        setMapPosition([lat, lon]);
                    }
                } catch (error) {
                    console.error("Geocoding failed", error);
                } finally {
                    setIsSearchingMap(false);
                }
            }, 1000),
        []
    );

    useEffect(() => {
        return () => {
            searchLocation.cancel();
        };
    }, [searchLocation]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLocation(initialData.location);
            setDescription(initialData.description || '');
            setPrice(String(initialData.price));
            setCapacity(String(initialData.capacity || 1));
            setAmenities(initialData.amenities.join(', '));
            setRoomCategory(initialData.category || 'Shared Room');
            setGenderPreference((initialData as any).genderPreference || 'any');


            setImages(initialData.images.map(url => ({ preview: url })));
            setVideos(initialData.videos?.map(url => ({ preview: url })) || []);
            setTour360(initialData.tour360?.map(url => ({ preview: url })) || []);

            if (initialData.coordinates?.coordinates) {
                // coordinates in DB are [longitude, latitude], Leaflet needs [latitude, longitude]
                const lng = initialData.coordinates.coordinates[0];
                const lat = initialData.coordinates.coordinates[1];
                if (lng !== 0 && lat !== 0) {
                    setMapPosition([lat, lng]);
                }
            }
        } else {
            setName('');
            setLocation('');
            setDescription('');
            setPrice('');
            setCapacity('1');
            setAmenities('');
            setRoomCategory('Shared Room');
            setGenderPreference('any');

            setImages([]);
            setVideos([]);
            setTour360([]);
            setMapPosition([33.6844, 73.0479]);
        }
    }, [initialData]);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>,
        currentMedia: MediaItem[],
        maxLimit: number,
        type: 'image' | 'video'
    ) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const files = Array.from(e.target.files);
            const remainingSlots = maxLimit - currentMedia.length;
            const filesToProcess = files.slice(0, remainingSlots);

            if (files.length > remainingSlots) {
                alert(`You can only upload ${remainingSlots} more files. The first ${remainingSlots} files were selected.`);
            }

            let processedCount = 0;
            filesToProcess.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setMedia(prev => [...prev, { preview: reader.result as string, file }]);
                    processedCount++;
                    if (processedCount === filesToProcess.length) {
                        setIsUploading(false);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveMedia = (
        indexToRemove: number,
        setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
    ) => {
        setMedia(prev => prev.filter((_, index) => index !== indexToRemove));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !location || !price) {
            alert("Please fill in all required fields (Name, Location, Price)");
            return;
        }

        const formData = new FormData();
        if (initialData?.id) formData.append('id', initialData.id);
        formData.append('name', name);
        formData.append('location', location);
        formData.append('price', price);
        formData.append('capacity', capacity);
        formData.append('description', description);
        formData.append('category', roomCategory);
        formData.append('genderPreference', genderPreference);
        
        // Append Coordinates
        formData.append('latitude', mapPosition[0].toString());
        formData.append('longitude', mapPosition[1].toString());


        // Amenities
        const amenitiesList = amenities.split(',').map(a => a.trim()).filter(a => a);
        // Append as individual fields or comma-separated string? 
        // Backend handles comma-separated string or array. Let's send as string to be safe with FormData quirks
        formData.append('amenities', amenitiesList.join(','));

        // Handle Media
        // Images
        images.forEach(item => {
            if (item.file) {
                formData.append('images', item.file);
            } else {
                formData.append('images', item.preview); // Existing URL
            }
        });

        // Videos
        videos.forEach(item => {
            if (item.file) {
                formData.append('videos', item.file);
            } else {
                formData.append('videos', item.preview);
            }
        });

        // Tour360
        tour360.forEach(item => {
            if (item.file) {
                formData.append('tour360', item.file);
            } else {
                formData.append('tour360', item.preview);
            }
        });

        // Cast to any because onSubmit expects Object but we are passing FormData
        // We updated mongoService to handle FormData, but the prop type in this component might need update or casting
        onSubmit(formData as any);
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{isEditing ? 'Edit Hostel' : 'Add a New Hostel'}</h2>
            <Input id="name" label="Hostel Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input id="location" label="Location Detail" value={location} onChange={e => {
                setLocation(e.target.value);
                searchLocation(e.target.value);
            }} required />

            <div className="mb-4 relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        Pin Exact Location on Map
                        {isSearchingMap && <span className="ml-2 text-xs text-blue-500 animate-pulse">Searching map...</span>}
                    </label>
                    <button 
                        type="button" 
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className="text-xs font-semibold flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                    >
                        {isGettingLocation ? (
                            <span className="flex items-center gap-1 animate-pulse">
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Locating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Use My Current Location
                            </span>
                        )}
                    </button>
                </div>
                <div className="w-full h-64 rounded-xl overflow-hidden shadow-sm border border-gray-300 dark:border-gray-600 relative z-0">
                    <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                        <MapUpdater center={mapPosition} />
                    </MapContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click anywhere on the map to drop the location pin exactly where your hostel is located.</p>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Briefly describe the hostel, its environment, and what makes it special."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="price" label="Price (PKR/month)" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                <Input id="capacity" label="Capacity (Persons)" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
            </div>

            <PriceEstimator
                location={location}
                roomType={roomCategory}
                amenities={amenities.split(',').map(a => a.trim()).filter(a => a)}
                capacity={parseInt(capacity) || 1}
                genderPreference={genderPreference}
                onPriceSuggested={(min, max) => {
                    const avg = Math.round((min + max) / 2);
                    setPrice(String(avg));
                }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="roomCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type</label>
                    <select
                        id="roomCategory"
                        value={roomCategory}
                        onChange={e => setRoomCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Shared Room">Shared Room</option>
                        <option value="Private Room">Private Room</option>
                        <option value="Entire Place">Entire Place</option>
                        <option value="Dormitory">Dormitory</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="genderPreference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender Preference</label>
                    <select
                        id="genderPreference"
                        value={genderPreference}
                        onChange={e => setGenderPreference(e.target.value as HostelCategory)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="boys">For Boys</option>
                        <option value="girls">For Girls</option>
                        <option value="any">For Anyone</option>
                    </select>
                </div>
            </div>

            <Input id="amenities" label="Amenities (comma-separated)" placeholder="e.g., wifi, laundry, mess" value={amenities} onChange={e => setAmenities(e.target.value)} />

            {/* Images Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hostel Images</label>
                {images.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {images.map((item, index) => (
                            <div key={index} className="relative group">
                                <img src={item.preview} alt={`Hostel preview ${index + 1}`} className="h-20 w-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(index, setImages)}
                                    className="absolute top-0 right-0 m-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-2">
                    <label htmlFor="image-upload" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 ${images.length >= MAX_IMAGES || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>{isUploading ? 'Uploading...' : `Add Images (${images.length}/${MAX_IMAGES})`}</span>
                        <input id="image-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setImages, images, MAX_IMAGES, 'image')} accept="image/*" multiple disabled={images.length >= MAX_IMAGES || isUploading} />
                    </label>
                </div>
            </div>

            {/* Videos Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Videos (Max 2)</label>
                {videos.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {videos.map((item, index) => (
                            <div key={index} className="relative group">
                                <video src={item.preview} className="h-24 w-full object-cover rounded-md" controls />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(index, setVideos)}
                                    className="absolute top-0 right-0 m-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-2">
                    <label htmlFor="video-upload" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 ${videos.length >= MAX_VIDEOS || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>{isUploading ? 'Uploading...' : `Add Videos (${videos.length}/${MAX_VIDEOS})`}</span>
                        <input id="video-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVideos, videos, MAX_VIDEOS, 'video')} accept="video/*" multiple disabled={videos.length >= MAX_VIDEOS || isUploading} />
                    </label>
                </div>
            </div>

            {/* 360 Tours Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">360° Tour Images (Max 5)</label>
                {tour360.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {tour360.map((item, index) => (
                            <div key={index} className="relative group">
                                <img src={item.preview} alt={`360 preview ${index + 1}`} className="h-20 w-full object-cover rounded-md border-2 border-blue-500" />
                                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] text-center">360°</div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(index, setTour360)}
                                    className="absolute top-0 right-0 m-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-2">
                    <label htmlFor="tour360-upload" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 ${tour360.length >= MAX_TOUR360 || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>{isUploading ? 'Uploading...' : `Add 360° Images (${tour360.length}/${MAX_TOUR360})`}</span>
                        <input id="tour360-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setTour360, tour360, MAX_TOUR360, 'image')} accept="image/*" multiple disabled={tour360.length >= MAX_TOUR360 || isUploading} />
                    </label>
                </div>
            </div>



            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isUploading}>{isEditing ? 'Save Changes' : 'Add Hostel'}</Button>
            </div>
        </form>
    );
};

export default PropertyListingForm;
