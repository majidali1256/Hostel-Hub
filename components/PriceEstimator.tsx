import React, { useState } from 'react';
import axios from 'axios';
import Button from './Button';

interface PriceEstimatorProps {
    location: string;
    roomType: string;
    amenities: string[];
    capacity: number;
    genderPreference: string;
    onPriceSuggested?: (min: number, max: number) => void;
}

interface PredictionResult {
    minPrice: number;
    maxPrice: number;
    reasoning: string;
    confidence: string;
}

const PriceEstimator: React.FC<PriceEstimatorProps> = ({
    location,
    roomType,
    amenities,
    capacity,
    genderPreference,
    onPriceSuggested
}) => {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [error, setError] = useState('');

    const handlePredict = async () => {
        if (!location || !roomType) {
            setError('Please fill in location and room type first.');
            return;
        }

        setLoading(true);
        setError('');
        setPrediction(null);

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

            const response = await axios.post(
                `${apiUrl}/api/hostels/predict-rent`,
                {
                    location,
                    roomType,
                    amenities,
                    capacity,
                    genderPreference
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setPrediction(response.data);
            if (onPriceSuggested) {
                onPriceSuggested(response.data.minPrice, response.data.maxPrice);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to get price estimate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 my-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    AI Price Estimator
                </h3>
                {!prediction && (
                    <Button
                        type="button"
                        onClick={handlePredict}
                        isLoading={loading}
                        variant="secondary"
                        className="text-xs px-3 py-1"
                    >
                        Get Suggestion
                    </Button>
                )}
            </div>

            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

            {prediction && (
                <div className="animate-fadeIn">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            PKR {prediction.minPrice.toLocaleString()} - {prediction.maxPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ month</span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-2">
                        "{prediction.reasoning}"
                    </p>

                    <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${prediction.confidence === 'High' ? 'bg-green-100 text-green-800' :
                                prediction.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {prediction.confidence} Confidence
                        </span>
                        <button
                            onClick={handlePredict}
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )}

            {!prediction && !loading && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get a fair rent estimate based on your location and amenities.
                </p>
            )}
        </div>
    );
};

export default PriceEstimator;
