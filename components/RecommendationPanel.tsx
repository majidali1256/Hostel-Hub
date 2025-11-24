import React, { useState, useEffect } from 'react';
import { Hostel } from '../types';

interface RecommendationPanelProps {
    userId: string | null;
    onSelectHostel?: (hostel: Hostel) => void;
}

interface RecommendedHostel extends Hostel {
    recommendationReason?: string;
    recommendationScore?: number;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ userId, onSelectHostel }) => {
    const [recommendations, setRecommendations] = useState<RecommendedHostel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchRecommendations();
        }
    }, [userId]);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('hh_access_token');
            const response = await fetch('http://localhost:5001/api/recommendations/personal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    preferences: {} // Can be enhanced with actual user preferences
                })
            });

            if (!response.ok) throw new Error('Failed to fetch recommendations');

            const data = await response.json();
            setRecommendations(data);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching recommendations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">AI Recommendations for You</h3>
                </div>
                <button
                    onClick={fetchRecommendations}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            {!isLoading && !error && recommendations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No recommendations available yet</p>
                    <p className="text-xs mt-1">Browse some hostels to get personalized suggestions</p>
                </div>
            )}

            {!isLoading && !error && recommendations.length > 0 && (
                <div className="space-y-3">
                    {recommendations.map((hostel, index) => (
                        <div
                            key={hostel.id}
                            onClick={() => onSelectHostel?.(hostel)}
                            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-gray-800 truncate">{hostel.name}</h4>
                                        {hostel.recommendationScore && (
                                            <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                                {hostel.recommendationScore}% match
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{hostel.location}</p>
                                    <p className="text-sm font-medium text-blue-600 mt-1">PKR {hostel.price}/month</p>
                                    {hostel.recommendationReason && (
                                        <div className="mt-2 bg-purple-50 rounded-md p-2">
                                            <p className="text-xs text-gray-700 flex items-start gap-1">
                                                <svg className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <span>{hostel.recommendationReason}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecommendationPanel;
