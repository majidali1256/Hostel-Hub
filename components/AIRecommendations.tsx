import React, { useEffect, useState } from 'react';
import { Hostel } from '../types';
import Button from './Button';

interface Recommendation {
    hostel: Hostel;
    rank: number;
    reason: string;
}

interface AIRecommendationsProps {
    onHostelClick: (hostel: Hostel) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onHostelClick }) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to see personalized recommendations');
                setIsLoading(false);
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/api/search/recommendations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                // Handle new API format with hostels array
                const hostels = data.hostels || data;
                const isAiPowered = data.aiPowered !== false;

                if (!isAiPowered) {
                    setError('Showing top hostels (AI temporarily unavailable)');
                }

                setRecommendations(hostels.map((h: any, i: number) => ({
                    hostel: h,
                    rank: i + 1,
                    reason: h.aiReason || (isAiPowered ? 'Recommended based on your preferences' : 'Top rated hostel')
                })));
            } else {
                throw new Error('Failed to load recommendations');
            }
        } catch (err: any) {
            console.error('Recommendations error:', err);
            setError('Showing top hostels (AI temporarily unavailable)');

            // Fallback: Load top-rated hostels
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                const res = await fetch(`${apiUrl}/api/hostels`);
                if (res.ok) {
                    const hostels = await res.json();
                    const topHostels = hostels
                        .sort((a: Hostel, b: Hostel) => (b.rating || 0) - (a.rating || 0))
                        .slice(0, 5);
                    setRecommendations(topHostels.map((h: Hostel, i: number) => ({
                        hostel: h,
                        rank: i + 1,
                        reason: 'Top rated hostel'
                    })));
                } else {
                    setError('Unable to load hostels');
                }
            } catch {
                setError('Unable to load hostels');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        AI Recommendations
                    </h2>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading personalized recommendations...
                </div>
            </div>
        );
    }

    if (error && recommendations.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🤖</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            AI Recommendations
                        </h2>
                    </div>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={loadRecommendations}>Try Again</Button>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0 && !error) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm border border-blue-200 dark:border-gray-600 p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Recommended for You
                    </h2>
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        AI
                    </span>
                </div>
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No recommendations available. Browse hostels below!
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm border border-blue-200 dark:border-gray-600 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Recommended for You
                    </h2>
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        AI
                    </span>
                </div>
                <button
                    onClick={loadRecommendations}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    🔄 Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
                </div>
            )}

            <div className="overflow-x-auto pb-2">
                <div className="flex gap-4">
                    {recommendations.map((rec, index) => (
                        <div
                            key={rec.hostel.id}
                            className="flex-shrink-0 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => onHostelClick(rec.hostel)}
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                #{rec.rank}
                            </div>

                            {/* Image */}
                            <div className="relative h-40">
                                {rec.hostel.images && rec.hostel.images.length > 0 ? (
                                    <img
                                        src={rec.hostel.images[0]}
                                        alt={rec.hostel.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-4xl">🏠</span>
                                    </div>
                                )}
                                {rec.hostel.verified && (
                                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        ✓ Verified
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">
                                    {rec.hostel.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    📍 {rec.hostel.location}
                                </p>

                                {/* AI Reason */}
                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
                                        <span className="mr-1">💡</span>
                                        <span>{rec.reason}</span>
                                    </p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            Rs {rec.hostel.price?.toLocaleString()}/mo
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                            {rec.hostel.rating ? `⭐ ${rec.hostel.rating.toFixed(1)}` : 'New'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                Powered by Google Gemini AI • Scroll right for more recommendations
            </p>
        </div>
    );
};

export default AIRecommendations;
