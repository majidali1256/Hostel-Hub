import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FairnessBadgeProps {
    hostelId: string;
    price: number;
}

interface AnalysisResult {
    hostelPrice: number;
    predictedRange: { min: number; max: number };
    fairnessLabel: 'Great Deal' | 'Fair Price' | 'Premium';
    reasoning: string;
}

const FairnessBadge: React.FC<FairnessBadgeProps> = ({ hostelId, price }) => {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                const response = await axios.get(`${apiUrl}/api/hostels/${hostelId}/fairness-analysis`);
                setAnalysis(response.data);
            } catch (error) {
                console.error('Failed to fetch fairness analysis:', error);
            } finally {
                setLoading(false);
            }
        };

        if (hostelId) {
            fetchAnalysis();
        }
    }, [hostelId]);

    if (loading || !analysis) return null;

    const getBadgeColor = (label: string) => {
        switch (label) {
            case 'Great Deal': return 'bg-green-100 text-green-800 border-green-200';
            case 'Fair Price': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Premium': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="relative inline-block">
            <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border cursor-help ${getBadgeColor(analysis.fairnessLabel)}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {analysis.fairnessLabel}
            </div>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 text-xs">
                    <div className="font-semibold mb-1 text-gray-900 dark:text-white">AI Price Analysis</div>
                    <div className="mb-2 text-gray-600 dark:text-gray-300">
                        Estimated Range: <span className="font-medium">PKR {analysis.predictedRange.min.toLocaleString()} - {analysis.predictedRange.max.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 italic leading-tight">
                        "{analysis.reasoning}"
                    </p>
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 rotate-45"></div>
                </div>
            )}
        </div>
    );
};

export default FairnessBadge;
