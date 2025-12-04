import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import MapSearch from './MapSearch';

interface Hostel {
    _id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    images: string[];
    amenities: string[];
    aiReason?: string;
    aiScore?: number;
}

interface SearchFilters {
    locations: string[];
    amenities: string[];
    priceRange: {
        minPrice: number;
        maxPrice: number;
        avgPrice: number;
    };
}

interface SmartSearchProps {
    onSelectHostel: (hostel: Hostel) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ onSelectHostel }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [results, setResults] = useState<Hostel[]>([]);
    const [recommendations, setRecommendations] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters | null>(null);

    // Filter states
    const [selectedLocation, setSelectedLocation] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState('rating');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // Load available filters on mount
    useEffect(() => {
        loadFilters();
        loadRecommendations();
    }, []);

    const loadFilters = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/search/filters`);
            setFilters(response.data);
            if (response.data.priceRange) {
                setPriceRange([response.data.priceRange.minPrice, response.data.priceRange.maxPrice]);
            }
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const loadRecommendations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${apiUrl}/api/search/recommendations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendations(response.data);
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    };

    // Debounced search suggestions
    const fetchSuggestions = useCallback(
        debounce(async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await axios.get(`${apiUrl}/api/search/suggestions`, {
                    params: { q: searchQuery }
                });
                setSuggestions(response.data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300),
        []
    );

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setShowSuggestions(true);
        fetchSuggestions(value);
    };

    const handleSearch = async (searchQuery?: string) => {
        const finalQuery = searchQuery || query;
        if (!finalQuery.trim()) return;

        setLoading(true);
        setShowSuggestions(false);

        try {
            const token = localStorage.getItem('token');
            const params: any = {
                q: finalQuery,
                location: selectedLocation || undefined,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
                amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
                minRating: minRating || undefined,
                sortBy
            };

            // Use smart search if user is logged in
            const endpoint = token ? '/api/search/smart' : '/api/search';
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const response = await axios.get(`${apiUrl}${endpoint}`, {
                params,
                ...config
            });

            setResults(response.data.hostels || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">🔍 Find Your Perfect Hostel</h1>
                <p className="text-gray-600">AI-powered search to help you discover the best hostels</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by location, amenities, or preferences..."
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 z-10">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setQuery(suggestion);
                                            setShowSuggestions(false);
                                            handleSearch(suggestion);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                        <span className="text-gray-700">{suggestion}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => handleSearch()}
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                        ⚙️ Filters
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && filters && (
                <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Location</label>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="">All Locations</option>
                                {filters.locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Price Range: PKR {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                            </label>
                            <input
                                type="range"
                                min={filters.priceRange.minPrice}
                                max={filters.priceRange.maxPrice}
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                className="w-full"
                            />
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                            <select
                                value={minRating}
                                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="0">Any Rating</option>
                                <option value="3">3+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="rating">Highest Rated</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Amenities</label>
                        <div className="flex flex-wrap gap-2">
                            {filters.amenities.slice(0, 12).map(amenity => (
                                <button
                                    key={amenity}
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`px-4 py-2 rounded-full text-sm transition ${selectedAmenities.includes(amenity)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => handleSearch()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={() => {
                                setSelectedLocation('');
                                setPriceRange([filters.priceRange.minPrice, filters.priceRange.maxPrice]);
                                setSelectedAmenities([]);
                                setMinRating(0);
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* AI Recommendations */}
            {recommendations.length > 0 && results.length === 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">✨ Recommended For You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.slice(0, 3).map(hostel => (
                            <div
                                key={hostel._id}
                                onClick={() => onSelectHostel(hostel)}
                                className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                            >
                                {hostel.images?.[0] && (
                                    <img src={hostel.images[0]} alt={hostel.name} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg">{hostel.name}</h3>
                                    <p className="text-gray-600 text-sm">{hostel.location}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-green-600 font-bold">PKR {hostel.price.toLocaleString()}/mo</span>
                                        <span className="text-yellow-500">⭐ {hostel.rating || 'New'}</span>
                                    </div>
                                    {hostel.aiReason && (
                                        <p className="text-xs text-blue-600 mt-2 italic">💡 {hostel.aiReason}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{results.length} Results Found</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            >
                                Map 🗺️
                            </button>
                        </div>
                    </div>

                    {viewMode === 'map' ? (
                        <MapSearch hostels={results} onSelectHostel={onSelectHostel} />
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                            {results.map(hostel => (
                                <div
                                    key={hostel._id}
                                    onClick={() => onSelectHostel(hostel)}
                                    className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                                >
                                    {hostel.images?.[0] && (
                                        <img src={hostel.images[0]} alt={hostel.name} className={viewMode === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-64 object-cover'} />
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg">{hostel.name}</h3>
                                        <p className="text-gray-600 text-sm">{hostel.location}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {hostel.amenities?.slice(0, 3).map(amenity => (
                                                <span key={amenity} className="text-xs bg-gray-100 px-2 py-1 rounded">{amenity}</span>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-green-600 font-bold text-lg">PKR {hostel.price.toLocaleString()}/mo</span>
                                            <span className="text-yellow-500">⭐ {hostel.rating || 'New'}</span>
                                        </div>
                                        {hostel.aiReason && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                                <strong>AI Insight:</strong> {hostel.aiReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && query && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No hostels found matching your search.</p>
                    <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
};

export default SmartSearch;
