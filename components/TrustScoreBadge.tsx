import React from 'react';

interface TrustScoreBadgeProps {
    trustScore?: number;
    isVerified?: boolean;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
    trustScore = 0,
    isVerified = false,
    size = 'medium',
    showLabel = true
}) => {
    // Determine color based on trust score
    const getScoreColor = () => {
        if (trustScore >= 100) return 'text-green-600 dark:text-green-400';
        if (trustScore >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getBgColor = () => {
        if (trustScore >= 100) return 'bg-green-100 dark:bg-green-900/30';
        if (trustScore >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    const getBorderColor = () => {
        if (trustScore >= 100) return 'border-green-300 dark:border-green-700';
        if (trustScore >= 50) return 'border-yellow-300 dark:border-yellow-700';
        return 'border-red-300 dark:border-red-700';
    };

    const sizeClasses = {
        small: 'text-xs px-2 py-1',
        medium: 'text-sm px-3 py-1.5',
        large: 'text-base px-4 py-2'
    };

    const iconSize = {
        small: 'w-3 h-3',
        medium: 'w-4 h-4',
        large: 'w-5 h-5'
    };

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-lg border ${getBgColor()} ${getBorderColor()} ${sizeClasses[size]} font-semibold ${getScoreColor()}`}
            title={`Trust Score: ${trustScore}% ${isVerified ? '(Verified)' : '(Not Verified)'}`}
        >
            {/* Trust Score Icon */}
            {trustScore >= 100 ? (
                <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )}

            {/* Trust Score Percentage */}
            <span>{trustScore}%</span>

            {/* Verified Badge */}
            {isVerified && trustScore >= 100 && showLabel && (
                <span className="text-xs opacity-75">Verified</span>
            )}
        </div>
    );
};

export default TrustScoreBadge;
