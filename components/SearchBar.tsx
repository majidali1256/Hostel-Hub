import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import Button from './Button';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  onSearch: (query: string, filters: Record<string, any>) => void;
}



const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
    onSearch(suggestion, {});
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query, {});
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        {aiEnabled && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
              🤖 AI
            </span>
          </div>
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => { setShowSuggestions(true); setIsFocused(true); }}
          onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); setIsFocused(false); }}
          placeholder={aiEnabled ? "Try: 'cheap hostel with WiFi near university'" : "Search by name, location, or description..."}
          className={`w-full pl-10 pr-20 py-3 bg-white dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 outline-none ${
            isFocused 
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        />

        {/* AI Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-semibold">
                🤖 AI Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-150 text-gray-700 dark:text-gray-300 group"
                >
                  <div className="flex items-center gap-2">
                    <SearchIcon />
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button type="submit">
        <div className="flex items-center gap-2">
          <SearchIcon />
          Search
        </div>
      </Button>
    </form>
  );
};

export default SearchBar;
