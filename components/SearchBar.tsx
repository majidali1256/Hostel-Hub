import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import Button from './Button';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  onSearch: (query: string, filters: Record<string, any>) => void;
}

const amenitiesOptions = ['wifi', 'laundry', 'mess', 'air-conditioning', 'security'];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([5000, 30000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Check if AI is available
  useEffect(() => {
    checkAiAvailability();
  }, []);

  const checkAiAvailability = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/search/suggestions?q=test`);
      setAiEnabled(true);
    } catch (error) {
      setAiEnabled(false);
    }
  };

  // Debounced AI suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!aiEnabled || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(`${apiUrl}/api/search/suggestions`, {
          params: { q: searchQuery }
        });
        setSuggestions(response.data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    }, 300),
    [aiEnabled]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    if (aiEnabled) {
      fetchSuggestions(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    // Auto-submit search
    onSearch(suggestion, { priceRange, amenities: selectedAmenities });
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query, { priceRange, amenities: selectedAmenities });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        {aiEnabled && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-semibold">
              🤖 AI
            </span>
          </div>
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={aiEnabled ? "Try: 'cheap hostel with WiFi near university'" : "Search by name, location, or description..."}
          className="w-full pl-10 pr-20 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />

        {/* AI Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-semibold">
                🤖 AI Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <SearchIcon />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenitiesOptions.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => handleAmenityToggle(amenity)}
                className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${selectedAmenities.includes(amenity)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Price Range: PKR {priceRange[0]} - {priceRange[1] === 30000 ? '30000+' : priceRange[1]}
          </label>
          <input
            id="price"
            type="range"
            min="5000"
            max="30000"
            step="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">
          <div className="flex items-center gap-2">
            <SearchIcon />
            Search
          </div>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
