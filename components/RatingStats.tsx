import React, { useState, useEffect } from 'react';

interface RatingStats {
    avgRating: number;
    avgCleanliness: number;
    avgAccuracy: number;
    avgCommunication: number;
    avgLocation: number;
    avgValue: number;
    totalReviews: number;
    breakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

interface RatingStatsProps {
    hostelId: string;
}

const RatingStats: React.FC<RatingStatsProps> = ({ hostelId }) => {
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [hostelId]);

    const loadStats = async () => {
        try {
            const res = await fetch(`http://localhost:5001/api/hostels/${hostelId}/rating`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load rating stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!stats || stats.totalReviews === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No ratings yet</p>
            </div>
        );
    }

    const StarDisplay = ({ rating }: { rating: number }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
            ))}
        </div>
    );

    const RatingBar = ({ stars, count }: { stars: number; count: number }) => {
        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

        return (
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-12">{stars} star</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Overall Rating */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                        {stats.avgRating.toFixed(1)}
                    </div>
                    <StarDisplay rating={stats.avgRating} />
                    <p className="text-sm text-gray-600 mt-2">
                        {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                </div>

                {/* Rating Breakdown */}
                <div className="flex-1 space-y-2">
                    <RatingBar stars={5} count={stats.breakdown[5]} />
                    <RatingBar stars={4} count={stats.breakdown[4]} />
                    <RatingBar stars={3} count={stats.breakdown[3]} />
                    <RatingBar stars={2} count={stats.breakdown[2]} />
                    <RatingBar stars={1} count={stats.breakdown[1]} />
                </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.avgCleanliness > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{stats.avgCleanliness.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">Cleanliness</p>
                    </div>
                )}
                {stats.avgAccuracy > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{stats.avgAccuracy.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">Accuracy</p>
                    </div>
                )}
                {stats.avgCommunication > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{stats.avgCommunication.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">Communication</p>
                    </div>
                )}
                {stats.avgLocation > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{stats.avgLocation.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">Location</p>
                    </div>
                )}
                {stats.avgValue > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{stats.avgValue.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">Value</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RatingStats;
