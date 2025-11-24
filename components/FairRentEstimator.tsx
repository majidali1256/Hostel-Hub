import React, { useState } from 'react';
import { api } from '../services/mongoService';

interface FairRentEstimatorProps {
  onClose?: () => void;
}

const FairRentEstimator: React.FC<FairRentEstimatorProps> = ({ onClose }) => {
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('shared-3-4');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    marketAverage: number;
    confidenceScore: number;
  } | null>(null);

  const roomTypes = [
    { value: 'private', label: 'Private Room (1 bed)' },
    { value: 'shared-2', label: 'Shared Room (2 beds)' },
    { value: 'shared-3-4', label: 'Shared Room (3-4 beds)' },
    { value: 'shared-5-8', label: 'Shared Room (5-8 beds)' },
    { value: 'dorm', label: 'Dormitory (8+ beds)' },
  ];

  const availableAmenities = [
    'WiFi',
    'Laundry',
    'Mess/Food',
    'AC',
    'Heater',
    'Attached Bath',
    'Generator',
    'Gym',
  ];

  const locations = [
    'Islamabad - F-6',
    'Islamabad - F-7',
    'Islamabad - F-8',
    'Islamabad - G-6',
    'Islamabad - G-7',
    'Rawalpindi - Saddar',
    'Rawalpindi - Satellite Town',
    'Lahore - DHA',
    'Lahore - Gulberg',
    'Lahore - Johar Town',
    'Karachi - Clifton',
    'Karachi - DHA',
    'Karachi - Gulshan',
  ];

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const calculateFairPrice = async () => {
    if (!location) {
      alert('Please select a location');
      return;
    }

    setIsCalculating(true);
    setResult(null);

    try {
      // Simulate API call - in production, this would call the backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock calculation based on inputs
      let basePrice = 5000;

      // Location multiplier
      if (location.includes('Islamabad - F-')) basePrice *= 1.5;
      else if (location.includes('DHA') || location.includes('Clifton')) basePrice *= 1.4;
      else if (location.includes('Gulberg')) basePrice *= 1.3;

      // Room type multiplier
      const roomMultipliers: Record<string, number> = {
        'private': 2.5,
        'shared-2': 1.8,
        'shared-3-4': 1.0,
        'shared-5-8': 0.7,
        'dorm': 0.5,
      };
      basePrice *= roomMultipliers[roomType] || 1;

      // Amenities bonus
      const amenityValue = amenities.length * 300;
      basePrice += amenityValue;

      // Add variance
      const estimatedPrice = Math.round(basePrice);
      const min = Math.round(basePrice * 0.85);
      const max = Math.round(basePrice * 1.15);
      const marketAverage = Math.round(basePrice * 0.95);

      setResult({
        estimatedPrice,
        priceRange: { min, max },
        marketAverage,
        confidenceScore: Math.min(95, 70 + amenities.length * 3),
      });
    } catch (error) {
      console.error('Failed to calculate price:', error);
      alert('Failed to calculate fair price. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Hostel Hub</span>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Fair Rent Estimator</h1>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fair Rent Estimator</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Use our AI-powered tool (Module 10) to calculate a competitive price for your listing based on market data.
          </p>

          {/* Location & Room Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location / Area
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg border border-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Area</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Type
              </label>
              <select
                id="roomType"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg border border-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {roomTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Included Amenities
            </label>
            <div className="flex flex-wrap gap-3">
              {availableAmenities.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    amenities.includes(amenity)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateFairPrice}
            disabled={isCalculating || !location}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Calculating...
              </span>
            ) : (
              'Calculate Fair Price'
            )}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estimated Fair Price</p>
                <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">PKR {result.estimatedPrice.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">per month</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price Range</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    PKR {result.priceRange.min.toLocaleString()} - {result.priceRange.max.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market Average</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">PKR {result.marketAverage.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{result.confidenceScore}%</p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Tip:</strong> This estimate is based on current market data for {location} with {amenities.length} amenities. 
                  Actual prices may vary based on property condition, exact location, and seasonal demand.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FairRentEstimator;
