import React, { useState, useEffect } from 'react';

interface TrustBadgeProps {
    userId: string;
    showScore?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

interface TrustScore {
    score: number;
    badges: string[];
}

const badgeConfig: Record<string, { label: string; color: string; icon: string }> = {
    verified: {
        label: 'Verified',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '✓'
    },
    superhost: {
        label: 'Superhost',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: '★'
    },
    responsive: {
        label: 'Responsive',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '⚡'
    },
    reliable: {
        label: 'Reliable',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: '🛡️'
    },
    experienced: {
        label: 'Experienced',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '🏆'
    },
    new: {
        label: 'New',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '🌟'
    },
    'top-rated': {
        label: 'Top Rated',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⭐'
    }
};

const TrustBadge: React.FC<TrustBadgeProps> = ({ userId, showScore = true, size = 'md' }) => {
    const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrustScore();
    }, [userId]);

    const loadTrustScore = async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/api/users/${userId}/trust-score`);
            if (!res.ok) {
                // Silently fail for UI components to prevent page crash
                console.warn(`Could not load trust score for ${userId}: ${res.status}`);
                setTrustScore(null);
                return;
            }
            const data = await res.json();
            setTrustScore(data);
        } catch (error) {
            console.error('Failed to load trust score:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            </div>
        );
    }

    if (!trustScore) {
        // Show a default placeholder when no trust score available
        return (
            <div className="flex items-center gap-1 text-gray-500 text-sm">
                <span>🛡️</span>
                <span>Trust Score: --</span>
            </div>
        );
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-2'
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-gray-600';
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {showScore && (
                <div className={`font-bold ${getScoreColor(trustScore.score)}`}>
                    Trust Score: {trustScore.score}/100
                </div>
            )}
            {trustScore.badges.map((badge) => {
                const config = badgeConfig[badge];
                if (!config) return null;

                return (
                    <span
                        key={badge}
                        className={`inline-flex items-center gap-1 ${config.color} border rounded-full font-medium ${sizeClasses[size]}`}
                    >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                    </span>
                );
            })}
        </div>
    );
};

export default TrustBadge;
