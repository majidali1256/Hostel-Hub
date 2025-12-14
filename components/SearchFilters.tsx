import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface SearchFiltersProps {
    onApplyFilters: (filters: FilterState) => void;
    onClearFilters: () => void;
}

export interface FilterState {
    priceRange: [number, number];
    amenities: string[];
    roomCategories: string[];
    genderPreference: string;
    minRating: number;
    verifiedOnly: boolean;
    location: string;
}

const AMENITIES_LIST = ['WiFi', 'Parking', 'Kitchen', 'Laundry', 'AC', 'Gym', 'Security'];
const ROOM_CATEGORIES = ['Shared Room', 'Private Room', 'Entire Place', 'Dormitory'];

const SearchFilters: React.FC<SearchFiltersProps> = ({ onApplyFilters, onClearFilters }) => {
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [selectedRoomCategories, setSelectedRoomCategories] = useState<string[]>([]);
    const [genderPreference, setGenderPreference] = useState<string>('any');
    const [minRating, setMinRating] = useState<number>(0);
    const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [availableLocations, setAvailableLocations] = useState<string[]>([]);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // Fetch available locations on mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/search/filters`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableLocations(data.locations || []);
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };
        fetchLocations();
    }, []);

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };



    const handleApply = () => {
        const filters: FilterState = {
            priceRange,
            amenities: selectedAmenities,
            roomCategories: selectedRoomCategories,
            genderPreference,
            minRating,
            verifiedOnly,
            location: selectedLocation
        };
        onApplyFilters(filters);
    };

    const handleClear = () => {
        setPriceRange([0, 1000000]);
        setSelectedAmenities([]);
        setSelectedRoomCategories([]);
        setGenderPreference('any');
        setMinRating(0);
        setVerifiedOnly(false);
        setSelectedLocation('');
        onClearFilters();
    };

    const hasActiveFilters =
        priceRange[0] > 0 ||
        priceRange[1] < 1000000 ||
        selectedAmenities.length > 0 ||
        selectedRoomCategories.length > 0 ||
        genderPreference !== 'any' ||
        minRating > 0 ||
        verifiedOnly ||
        selectedLocation !== '';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">🔍 Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={handleClear}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Price Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    💰 Price Range
                </label>
                <div className="px-2">
                    <Slider
                        range
                        min={0}
                        max={1000000}
                        step={10000}
                        value={priceRange}
                        onChange={(value) => setPriceRange(value as [number, number])}
                        trackStyle={[{ backgroundColor: '#3b82f6' }]}
                        handleStyle={[
                            { borderColor: '#3b82f6', backgroundColor: '#fff' },
                            { borderColor: '#3b82f6', backgroundColor: '#fff' }
                        ]}
                    />
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>Rs {priceRange[0].toLocaleString()}</span>
                    <span>Rs {priceRange[1].toLocaleString()}</span>
                </div>
            </div>

            {/* Location Filter */}
            {availableLocations.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        📍 Location
                    </label>
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Locations</option>
                        {availableLocations.map((location) => (
                            <option key={location} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Amenities */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    ✨ Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedAmenities.includes(amenity)}
                                onChange={() => toggleAmenity(amenity)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Room Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🏠 Room Type
                </label>
                <select
                    value={selectedRoomCategories[0] || ''}
                    onChange={(e) => setSelectedRoomCategories(e.target.value ? [e.target.value] : [])}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="">Any Room Type</option>
                    {ROOM_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            {/* Gender Preference */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    👥 Gender Preference
                </label>
                <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="any">Any</option>
                    <option value="boys">Boys Only</option>
                    <option value="girls">Girls Only</option>
                </select>
            </div>

            {/* Minimum Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    ⭐ Minimum Rating
                </label>
                <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map(rating => (
                        <button
                            key={rating}
                            onClick={() => setMinRating(rating)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${minRating === rating
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {rating === 0 ? 'Any' : `${rating}+`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Verified Only */}
            <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ✓ Verified Hostels Only
                    </span>
                </label>
            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleApply}
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default SearchFilters;
